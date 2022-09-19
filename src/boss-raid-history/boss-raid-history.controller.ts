import { Controller, Get, Post, Body, Patch, HttpCode } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
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
import {
  GetRankingInfoListDto,
  GetRankingInfoListResponseDto,
} from './dto/get-ranking-info.dto';

@ApiTags('BossRaid API')
@Controller('bossRaid')
export class BossRaidHistoryController {
  constructor(
    private readonly bossRaidHistoryService: BossRaidHistoryService,
  ) {}

  @ApiOperation({
    summary: '보스레이드 상태 조회 API',
    description:
      '보스레이드 현재 상태를 응답합니다. (입장 가능 여부, 현재 진행중인 유저가 있다면, 해당 유저의 id)',
  })
  @ApiOkResponse({
    description:
      '보스레이드 현재 상태를 응답합니다. (입장 가능 여부, 현재 진행중인 유저가 있다면, 해당 유저의 id)',
    type: GetBossRaidStatusResponseDto,
  })
  @Get()
  getBossRaidStatus(): Promise<Partial<GetBossRaidStatusResponseDto>> {
    return this.bossRaidHistoryService.getBossRaidStatus();
  }

  @ApiOperation({
    summary: '보스레이드 랭킹 조회 API',
    description: '보스레이드 totalScore 내림차순으로 랭킹을 조회합니다.',
  })
  @ApiOkResponse({
    description: '보스레이드 totalScore 내림차순으로 랭킹을 조회합니다.',
    type: GetRankingInfoListResponseDto,
  })
  @Get('topRankerList')
  getRankingInfoList(
    @Body() getRankingInfoListDto: GetRankingInfoListDto,
  ): Promise<RankingData> {
    return this.bossRaidHistoryService.getRankingInfoList(
      getRankingInfoListDto,
    );
  }

  @ApiOperation({
    summary: '보스레이드 시작 API',
    description: '레이드가 시작 가능하다면 보스레이드를 시작합니다.',
  })
  @ApiCreatedResponse({
    description: '레이드가 시작 가능하다면 보스레이드를 시작합니다.',
    type: EnterBossRaidResponseDto,
  })
  @HttpCode(201)
  @Post('enter')
  enterBossRaid(
    @Body() enterBossRaidDto: EnterBossRaidDto,
  ): Promise<Partial<EnterBossRaidResponseDto>> {
    return this.bossRaidHistoryService.enterBossRaid(enterBossRaidDto);
  }

  @ApiOperation({
    summary: '보스레이드 종료 API',
    description: '보스레이드를 종료합니다.',
  })
  @ApiOkResponse({
    description: '보스레이드를 종료합니다.',
  })
  @Patch('end')
  endBossRaid(@Body() endBossRaidDto: EndBossRaidDto): Promise<void> {
    return this.bossRaidHistoryService.endBossRaid(endBossRaidDto);
  }
}
