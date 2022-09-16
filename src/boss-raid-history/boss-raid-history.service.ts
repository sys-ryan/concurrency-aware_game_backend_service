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
import { UserService } from 'src/user/user.service';
import { DataSource, Repository } from 'typeorm';
import { CreateBossRaidHistoryDto } from './dto/create-boss-raid-history.dto';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { UpdateBossRaidHistoryDto } from './dto/update-boss-raid-history.dto';
import { BossRaidAvailability } from './entities/boss-raid-availability.entity';
import { BossRaidHistory } from './entities/boss-raid-history.entity';
import { HttpService } from '@nestjs/axios';
import { endWith, lastValueFrom } from 'rxjs';

export interface Level {
  level: number;
  score: number;
}
export interface BosRaidsStaticData {
  bossRaidLimitSeconds: number;
  levels: Level[];
}

@Injectable()
export class BossRaidHistoryService implements OnModuleInit {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(BossRaidHistory)
    private bossRaidHistoryRepository: Repository<BossRaidHistory>,
    @InjectRepository(BossRaidAvailability)
    private bossRaidAvailabilityRepository: Repository<BossRaidAvailability>,
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
  }

  create(createBossRaidHistoryDto: CreateBossRaidHistoryDto) {
    return 'This action adds a new bossRaidHistory';
  }

  async getBossRaidStatus() {
    const bossRaidAvailability = (
      await this.bossRaidAvailabilityRepository.find()
    )[0];

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

    const { nextAvailableEnterTime, currentTime } =
      this.getTimeInfo(lastEnterTime);

    // 입장 불가능
    const isAvailable = canEnter || currentTime > nextAvailableEnterTime;
    // const isGameNotFinished =
    //   canEnter === false || currentTime < nextAvailableEnterTime;
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

  async enterBossRaid(enterBossRaidDto: EnterBossRaidDto) {
    // user 유효성 검사
    const user = await this.userService.findById(enterBossRaidDto.userId);

    // TODO : level 유효성 검사

    let bossRaidAvailability = (
      await this.bossRaidAvailabilityRepository.find()
    )[0];

    let canEnter: boolean;
    let isAvailable: boolean;
    let userId: number;
    if (!bossRaidAvailability) {
      // 입장 가능 조건
      // - 아무도 보스레이드를 시작한 기록이 없다면 시작 가능
      bossRaidAvailability = await this.bossRaidAvailabilityRepository.create({
        canEnter: true,
        userId: user.id,
      });
      await this.bossRaidAvailabilityRepository.save(bossRaidAvailability);
      userId = user.id;
      isAvailable = true;
    } else {
      const {
        userId: enteredUserId,
        canEnter: _canEnter,
        enteredAt: lastEnterTime,
      } = bossRaidAvailability;

      canEnter = _canEnter;
      userId = enteredUserId;

      const { nextAvailableEnterTime, currentTime } =
        this.getTimeInfo(lastEnterTime);

      // 입장 가능 조건
      // - 시작한 기록이 있다면 마지막으로 시작한 유저가 보스레이드를 종료했거나,
      //    시작한 시간으로부터 레이드 제한 시간 만큼 경과되었어야 함
      isAvailable = canEnter || currentTime > nextAvailableEnterTime;
    }

    // 입장 조건 위배
    // 레이드 시작이 불가하다면 isEntered: false
    if (!isAvailable) {
      return {
        isEntered: false,
      };
    }

    console.log('userid', userId);
    // 유저 입장 (동시성 고려 lock)
    const currentTime = new Date();
    await this.dataSource
      .getRepository(BossRaidAvailability)
      .createQueryBuilder('boss_raid_availability')
      .setLock('pessimistic_read')
      .update(BossRaidAvailability)
      .set({
        canEnter: false,
        userId,
        enteredAt: currentTime,
      })
      .where('id = :id', { id: bossRaidAvailability.id })
      .execute();

    // boss raid history 생성
    const history = await this.bossRaidHistoryRepository.create({
      user,
      enterTime: new Date(currentTime),
      level: enterBossRaidDto.level,
      score: 0,
    });
    await this.bossRaidHistoryRepository.save(history);

    return {
      isEntered: true,
      raidRecordId: history.raidRecordId,
    };
  }

  async endBossRaid(endBossRaidDto: EndBossRaidDto) {
    const currentTime = new Date();
    const { raidRecordId, userId } = endBossRaidDto;

    let bossRaidsStaticData: BosRaidsStaticData;
    try {
      bossRaidsStaticData = await this.cacheManager.get('bossRaidsStaticData');
      console.log('bossRaidsStaticData');
      console.log(bossRaidsStaticData);
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

    // TODO: 레이드 level에 따른 score 반영
    const score = await this.getScoreByLevel(
      history.level,
      bossRaidsStaticData.levels,
    );

    history.score = score;
    history.endTime = currentTime;

    await this.bossRaidHistoryRepository.save(history);
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

  findOne(id: number) {
    return `This action returns a #${id} bossRaidHistory`;
  }

  update(id: number, updateBossRaidHistoryDto: UpdateBossRaidHistoryDto) {
    return `This action updates a #${id} bossRaidHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} bossRaidHistory`;
  }

  getTimeInfo(lastEnterTime: Date) {
    const nextAvailableEnterTime = new Date(lastEnterTime);
    // TODO : 3을 변수로 바꾸기
    nextAvailableEnterTime.setMinutes(nextAvailableEnterTime.getMinutes() + 3);

    const currentTime = new Date();

    return { nextAvailableEnterTime, currentTime };
  }
}
