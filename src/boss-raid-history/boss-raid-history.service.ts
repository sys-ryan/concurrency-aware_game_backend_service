import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateBossRaidHistoryDto } from './dto/create-boss-raid-history.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { GetBossRaidStatusResponseDto } from './dto/get-boss-raid-status.dto';
import { UpdateBossRaidHistoryDto } from './dto/update-boss-raid-history.dto';

@Injectable()
export class BossRaidHistoryService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  create(createBossRaidHistoryDto: CreateBossRaidHistoryDto) {
    return 'This action adds a new bossRaidHistory';
  }

  async getBossRaidStatus(): Promise<Partial<GetBossRaidStatusResponseDto>> {
    const canEnter = await this.cacheManager.get('canEnter');
    const enteredUserId = +(await this.cacheManager.get('enteredUserId'));
    const lastEnteredAt: string = await this.cacheManager.get('lastEnteredAt');

    const { nextAvailableEnterTime, currentTime } =
      this.getTimeInfo(lastEnteredAt);

    let response: Partial<GetBossRaidStatusResponseDto> = {};

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

    return response;
  }

  // async enterBossRaid(enterBossRaidDto: EnterBossRaidDto) {
  //   const canEnter = await this.cacheManager.get('canEnter');
  //   const lastEnteredAt: string = await this.cacheManager.get('lastEnteredAt');

  //   const { nextAvailableEnterTime, currentTime } =
  //     this.getTimeInfo(lastEnteredAt);

  //   // 입장 가능 조건
  //   // - 아무도 보스레이드를 시작한 기록이 없다면 시작 가능
  //   // - 시작한 기록이 있다면 마지막으로 시작한 유저가 보스레이드를 종료했거나,
  //   //    시작한 시간으로부터 레이드 제한 시간 만큼 경과되었어야 함
  //   const isAvailable =
  //     canEnter === null || canEnter || currentTime > nextAvailableEnterTime;

  //   // 입장 조건 위배시 예외 처리
  //   if (!isAvailable) {
  //     throw new BadRequestException(
  //       'Boss raid is not availablie now. Try again later.',
  //     );
  //   }

  //   return 'enter boss raid api';
  // }

  findOne(id: number) {
    return `This action returns a #${id} bossRaidHistory`;
  }

  update(id: number, updateBossRaidHistoryDto: UpdateBossRaidHistoryDto) {
    return `This action updates a #${id} bossRaidHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} bossRaidHistory`;
  }

  getTimeInfo(lastEnteredAt: string) {
    const lastEnterTime = new Date(lastEnteredAt);

    let nextAvailableEnterTime = new Date(lastEnterTime);
    // TODO : 3을 변수로 바꾸기
    nextAvailableEnterTime.setMinutes(nextAvailableEnterTime.getMinutes() + 3);

    const currentTime = new Date();

    return { nextAvailableEnterTime, currentTime };
  }
}
