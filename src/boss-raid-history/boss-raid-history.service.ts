import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class BossRaidHistoryService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(BossRaidHistory)
    private bossRaidHistoryRepository: Repository<BossRaidHistory>,
    @InjectRepository(BossRaidAvailability)
    private bossRaidAvailabilityRepository: Repository<BossRaidAvailability>,
    private dataSource: DataSource,
    private userService: UserService,
  ) {}

  create(createBossRaidHistoryDto: CreateBossRaidHistoryDto) {
    return 'This action adds a new bossRaidHistory';
  }

  async getBossRaidStatus() {
    let response;

    const bossRaidAvailability = (
      await this.bossRaidAvailabilityRepository.find()
    )[0];

    if (!bossRaidAvailability) {
      // 아무도 보스레이드를 시작한 기록이 없다면 시작 가능합니다.
      response = {
        canEnter: true,
      };
    } else {
      const {
        userId: enteredUserId,
        canEnter,
        enteredAt: lastEnterTime,
      } = bossRaidAvailability;

      const { nextAvailableEnterTime, currentTime } =
        this.getTimeInfo(lastEnterTime);

      // 입장 불가능
      const isGameNotFinished =
        canEnter === false || currentTime < nextAvailableEnterTime;

      if (isGameNotFinished) {
        response = {
          canEnter: false,
          enteredUserId,
        };
      } else {
        //입장 가능
        await this.cacheManager.set('canEnter', true);

        response = {
          canEnter: true,
        };
      }
    }

    return response;
  }

  async enterBossRaid(enterBossRaidDto: EnterBossRaidDto) {
    // user 유효성 검사
    const user = await this.userService.findById(enterBossRaidDto.userId);

    // TODO : level 유효성 검사

    let bossRaidAvailability = (
      await this.bossRaidAvailabilityRepository.find()
    )[0];

    console.log('bossRaidAvailability', bossRaidAvailability);
    console.log(user);

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
      console.log('!bossRaidAvailability');
      console.log(userId);
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

  async endBossRaid(endBossRaidDto: EndBossRaidDto) {}

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
