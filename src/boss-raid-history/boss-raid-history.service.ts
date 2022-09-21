import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { UserService } from '../user/user.service';
import { DataSource, Repository } from 'typeorm';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import {
  EnterBossRaidDto,
  EnterBossRaidResponseDto,
} from './dto/enter-boss-raid.dto';
import { BossRaidHistory } from './entities/boss-raid-history.entity';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { GetRankingInfoListDto } from './dto/get-ranking-info.dto';
import { RankingInfo } from '../common/types';
import { GetBossRaidStatusResponseDto } from './dto/get-boss-raid-status.dto';

import { redlock } from '../redis/redlock';

export interface Level {
  level: number;
  score: number;
}

export interface BossRaidAvailability {
  userId: number;
  canEnter: boolean;
  enteredAt: Date;
}

export interface BosRaidsStaticData {
  // 제한 시간 (sec)
  bossRaidLimitSeconds: number;

  //레벨 별 레이드 처치 점수
  levels: Level[];
}

export interface RankingData {
  topRankerInfoList: RankingInfo[];
  myRankingInfo: RankingInfo;
}

export interface TimeInfo {
  nextAvailableEnterTime: Date;
  currentTime: Date;
}

@Injectable()
export class BossRaidHistoryService implements OnModuleInit {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(BossRaidHistory)
    private bossRaidHistoryRepository: Repository<BossRaidHistory>,
    private dataSource: DataSource,
    private userService: UserService,
    private httpService: HttpService,
  ) {}

  // lifecycle hook을 사용하여 service가 생성될 때, Boss Raid Static Data를 fecth하여 Redis에 저장
  async onModuleInit() {
    const url = `https://dmpilf5svl7rv.cloudfront.net/assignment/backend/bossRaidData.json`;

    try {
      const response$ = this.httpService.get(url);
      const data = (await lastValueFrom(response$)).data;
      const bossRaidsStaticData = data.bossRaids[0];

      await this.cacheManager.set('bossRaidsStaticData', bossRaidsStaticData);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch BossRaid Static Data.',
      );
    }

    // 모듈 마운트 시 보스레이드 상태 캐시정보 clear
    await this.cacheManager.del('bossRaidAvailability');
  }

  /**
   * 보스레이드 플레이가 가능한 상태인지 여부를 조회
   * @returns 보스레이드 플레이 가능 여부 (boolean)
   */
  async getBossRaidStatus(): Promise<Partial<GetBossRaidStatusResponseDto>> {
    const bossRaidAvailability =
      await this.cacheManager.get<BossRaidAvailability>('bossRaidAvailability');

    if (!bossRaidAvailability) {
      // 아무도 보스레이드를 시작한 기록이 없다면 시작 가능합니다.
      return {
        canEnter: true,
      };
    }

    const {
      userId: enteredUserId,
      canEnter,
      enteredAt: lastEnterTime,
    } = bossRaidAvailability;

    const { nextAvailableEnterTime, currentTime } = await this.getTimeInfo(
      lastEnterTime,
    );

    // 입장 가능 여부
    const isAvailable = canEnter || currentTime > nextAvailableEnterTime;
    if (isAvailable) {
      return {
        canEnter: true,
      };
    }

    return {
      canEnter: false,
      enteredUserId,
    };
  }

  /**
   * 보스레이드에 시작 가능 여부를 체크하고 가능하다면 보스레이드에 입장하면서 availability 갱신, history 생성
   * @param enterBossRaidDto 보스레이드 시작 request body
   * @returns { isEntered, raidRecordId }
   */
  async enterBossRaid(
    enterBossRaidDto: EnterBossRaidDto,
  ): Promise<Partial<EnterBossRaidResponseDto>> {
    // user 유효성 검사
    const user = await this.userService.findById(enterBossRaidDto.userId);

    // level 유효성 검사
    const levelsList = await this.getLevelsFromCache();
    if (!levelsList.includes(enterBossRaidDto.level)) {
      throw new BadRequestException('Wrong level.');
    }

    try {
      const lock = await redlock.acquire(['bossRaidLock'], 5000);

      const bossRaidAvailability =
        await this.cacheManager.get<BossRaidAvailability>(
          'bossRaidAvailability',
        );

      let canEnter: boolean;
      let isAvailable: boolean;

      if (!bossRaidAvailability) {
        // 입장 가능 조건
        // - 아무도 보스레이드를 시작한 기록이 없다면 시작 가능
        await this.cacheManager.set('bossRaidAvailability', {
          canEnter: false,
          userId: user.id,
          enteredAt: new Date(),
        });

        isAvailable = true;
      } else {
        const {
          userId,
          canEnter: _canEnter,
          enteredAt: lastEnterTime,
        } = bossRaidAvailability;

        canEnter = _canEnter;

        const { nextAvailableEnterTime, currentTime } = await this.getTimeInfo(
          lastEnterTime,
        );

        // 입장 가능 조건
        // - 시작한 기록이 있다면 마지막으로 시작한 유저가 보스레이드를 종료했거나,
        //    시작한 시간으로부터 레이드 제한 시간 만큼 경과되었어야 함
        isAvailable = canEnter || currentTime > nextAvailableEnterTime;
      }

      // 입장 조건 위배
      if (!isAvailable) {
        await lock.release();
        // 레이드 시작이 불가하다면 isEntered: false
        return {
          isEntered: false,
        };
      }

      // boss raid history 생성
      const currentTime = new Date();
      const history = await this.bossRaidHistoryRepository.create({
        user,
        enterTime: new Date(currentTime),
        level: enterBossRaidDto.level,
        score: 0, // end 할 때 업데이트 될 것임.
      });
      await this.bossRaidHistoryRepository.save(history);

      await lock.release();

      return {
        isEntered: true,
        raidRecordId: history.raidRecordId,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Cache error.');
    }
  }

  /**
   * 보스레이드를 종료하면서 레이드 level에 따른 score 반영하고 endTime 과 함께 history를 업데이트 합니다.
   * 추가로 게임 종료 후 랭킹 데이터를 업데이트하고 캐시에도 업데이트된 데이터를 가지도록 합니다.
   * @param endBossRaidDto
   */
  async endBossRaid(endBossRaidDto: EndBossRaidDto): Promise<void> {
    const currentTime = new Date();
    const { raidRecordId, userId } = endBossRaidDto;

    let bossRaidsStaticData: BosRaidsStaticData;
    try {
      // level에 따른 score 반영을 위해 캐시에서 boss raid static data get
      bossRaidsStaticData = await this.cacheManager.get('bossRaidsStaticData');
    } catch (err) {
      throw new InternalServerErrorException(
        'Faild to read Boss Raids Static Data.',
      );
    }

    // 유효성 검사 - 저장된 userId 와 raidRecordId 일치 여부 확인
    const history = await this.bossRaidHistoryRepository.findOne({
      where: { raidRecordId },
      relations: ['user'],
    });

    // 존재하지 않는 raidRecordId일 경우 예외처리
    if (!history) {
      throw new NotFoundException(
        `Boss Raid History (id: ${raidRecordId}) not found.`,
      );
    }

    // raid history에 저장된 userID와 raidRecordId가 match 되지 않는 경우 예외처리
    if (history.user.id !== userId) {
      throw new BadRequestException('User does not match.');
    }

    // 이미 종료된 레이드일 경우 예외 처리
    if (history.endTime) {
      throw new BadRequestException('This raid was already finished');
    }

    // 시작한 시간으로부터 레이드 제한시간이 지났다면 예외처리
    const timeDiff =
      currentTime.valueOf() - new Date(history.enterTime).valueOf();

    const diffInSeconds = Math.floor(timeDiff / 1000);
    const bossRaidLimitSeconds = bossRaidsStaticData.bossRaidLimitSeconds;
    if (diffInSeconds > bossRaidLimitSeconds) {
      throw new BadRequestException(
        'The duration of requested game exeeds limit seconds.',
      );
    }

    // 레이드 level에 따른 score 반영
    const score = await this.getScoreByLevel(
      history.level,
      bossRaidsStaticData.levels,
    );

    history.score = score;
    history.endTime = currentTime;

    await this.bossRaidHistoryRepository.save(history);

    // boss raid status update (availability)
    // canEnter: true 로 변경
    const lock = await redlock.acquire(['bossRaidLock'], 5000);

    await this.cacheManager.set('bossRaidAvailability', {
      canEnter: true,
      userId: null,
      enteredAt: null,
    });

    await lock.release();

    // 랭킹 데이터 DB 업데이트
    const topRankerInfoList = await this.calculateRankingData(); // 게임 종료 후 업데이트된 history반영한 랭킹 정보 get

    // 캐시에 업데이트된 랭킹 정보 set
    await this.cacheManager.set('topRankerInfoList', topRankerInfoList);
  }

  /**
   * Redis에 저장되어 있는 Boss Raid Static Data에서 각 level에 해당하는 score를 찾아 반환합니다.
   * @param level score를 알고자 하는 level
   * @param levels level별 score 값을 저장하고 있는 object
   * @returns score
   */
  private async getScoreByLevel(
    level: number,
    levels: Level[],
  ): Promise<number> {
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].level === level) {
        return levels[i].score;
      }
    }
  }

  /**
   * 전체 레이드 랭킹 정보와 userId에 해당하는 랭킹 정보를 캐시에서 조회합니다.
   * @param getRankingInfoListDto 조회하고자 하는 user의 userId를 가진 객체
   * @returns 레이드 랭킹 정보
   */
  async getRankingInfoList(
    getRankingInfoListDto: GetRankingInfoListDto,
  ): Promise<RankingData> {
    const { userId } = getRankingInfoListDto;
    // userId 유효성 검사
    await this.userService.findById(userId);

    // 캐시된 랭킹 데이터 조회
    let topRankerInfoList: RankingInfo[] = await this.cacheManager.get(
      'topRankerInfoList',
    );

    // 캐시된 데이터 없을 시 데이터 데이터 생성 및 캐싱
    if (!topRankerInfoList) {
      topRankerInfoList = await this.calculateRankingData();
      await this.cacheManager.set('topRankerInfoList', topRankerInfoList);
    }

    // my ranking info 검색
    let myRankingInfo: RankingInfo = topRankerInfoList.find(
      (info) => info.userId === userId,
    );

    if (!myRankingInfo) {
      myRankingInfo = null;
    }

    // 캐시된 데이터 있을 시 데이터 format후 return
    return {
      topRankerInfoList,
      myRankingInfo,
    };
  }

  /**
   * DB에서 각 유저의 점수 합에 따른 랭킹 정보를 조회하여 반환합니다.
   */
  private async calculateRankingData(): Promise<RankingInfo[]> {
    let result = await this.dataSource
      .getRepository(BossRaidHistory)
      .createQueryBuilder('history')
      .select('history.userId')
      .addSelect('SUM(history.score)', 'totalScore')
      .addSelect(
        'RANK() OVER (ORDER BY SUM(history.score) DESC) - 1 as "ranking"',
      )
      .groupBy('history.userId')
      .getRawMany();

    // format ranking data
    result = result.map((r) => ({
      userId: r.userId,
      totalScore: +r.totalScore,
      ranking: +r.ranking,
    }));

    return result;
  }

  /**
   * 마지막 레이드 입장 시간을 기준으로 레이드 만료 시간을 계산하여 다음 레이드 시작 가능 시간을 반환합니다
   * @param lastEnterTime 마지막 레이드 입장 시간
   * @returns { 다음 레이드 시작 가능 시간, 현재 시간 }
   */
  async getTimeInfo(lastEnterTime: Date): Promise<TimeInfo> {
    const nextAvailableEnterTime = new Date(lastEnterTime);

    const bossRaidLimitSeconds = await this.getBossRaidLimitSecondsFromCache();
    nextAvailableEnterTime.setSeconds(
      nextAvailableEnterTime.getSeconds() + bossRaidLimitSeconds,
    );

    const currentTime = new Date();

    return { nextAvailableEnterTime, currentTime };
  }

  private async getLevelsFromCache(): Promise<number[]> {
    const data = await this.cacheManager.get<BosRaidsStaticData>(
      'bossRaidsStaticData',
    );
    const levels = data.levels.map((l) => l.level);
    return levels;
  }

  private async getBossRaidLimitSecondsFromCache(): Promise<number> {
    const data = await this.cacheManager.get<BosRaidsStaticData>(
      'bossRaidsStaticData',
    );

    return data.bossRaidLimitSeconds;
  }
}
