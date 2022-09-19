import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { BossRaidHistoryService } from './boss-raid-history.service';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { GetRankingInfoListDto } from './dto/get-ranking-info.dto';

@Controller('bossRaid')
export class BossRaidHistoryController {
  constructor(
    private readonly bossRaidHistoryService: BossRaidHistoryService,
  ) {}

  @Get()
  getBossRaidStatus() {
    return this.bossRaidHistoryService.getBossRaidStatus();
  }

  @Get('topRankerList')
  getRankingInfoList(@Body() getRankingInfoListDto: GetRankingInfoListDto) {
    return this.bossRaidHistoryService.getRankingInfoList(
      getRankingInfoListDto,
    );
  }

  @Post('enter')
  enterBossRaid(@Body() enterBossRaidDto: EnterBossRaidDto) {
    return this.bossRaidHistoryService.enterBossRaid(enterBossRaidDto);
  }

  @Patch('end')
  endBossRaid(@Body() endBossRaidDto: EndBossRaidDto) {
    return this.bossRaidHistoryService.endBossRaid(endBossRaidDto);
  }
}
