import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import {
  BossRaidHistoryService,
  RankingData,
} from './boss-raid-history.service';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import {
  EnterBossRaidDto,
  EnterBossRaidResponseDto,
} from './dto/enter-boss-raid.dto';
import { GetBossRaidStatusResponseDto } from './dto/get-boss-raid-status.dto';
import { GetRankingInfoListDto } from './dto/get-ranking-info.dto';

@Controller('bossRaid')
export class BossRaidHistoryController {
  constructor(
    private readonly bossRaidHistoryService: BossRaidHistoryService,
  ) {}

  @Get()
  getBossRaidStatus(): Promise<Partial<GetBossRaidStatusResponseDto>> {
    return this.bossRaidHistoryService.getBossRaidStatus();
  }

  @Get('topRankerList')
  getRankingInfoList(
    @Body() getRankingInfoListDto: GetRankingInfoListDto,
  ): Promise<RankingData> {
    return this.bossRaidHistoryService.getRankingInfoList(
      getRankingInfoListDto,
    );
  }

  @Post('enter')
  enterBossRaid(
    @Body() enterBossRaidDto: EnterBossRaidDto,
  ): Promise<Partial<EnterBossRaidResponseDto>> {
    return this.bossRaidHistoryService.enterBossRaid(enterBossRaidDto);
  }

  @Patch('end')
  endBossRaid(@Body() endBossRaidDto: EndBossRaidDto): Promise<void> {
    return this.bossRaidHistoryService.endBossRaid(endBossRaidDto);
  }
}
