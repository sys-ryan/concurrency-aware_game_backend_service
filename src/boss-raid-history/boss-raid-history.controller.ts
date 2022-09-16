import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BossRaidHistoryService } from './boss-raid-history.service';
import { CreateBossRaidHistoryDto } from './dto/create-boss-raid-history.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { GetBossRaidStatusResponseDto } from './dto/get-boss-raid-status.dto';
import { UpdateBossRaidHistoryDto } from './dto/update-boss-raid-history.dto';

@Controller('bossRaid')
export class BossRaidHistoryController {
  constructor(
    private readonly bossRaidHistoryService: BossRaidHistoryService,
  ) {}

  @Post()
  create(@Body() createBossRaidHistoryDto: CreateBossRaidHistoryDto) {
    return this.bossRaidHistoryService.create(createBossRaidHistoryDto);
  }

  @Get()
  getBossRaidStatus() {
    return this.bossRaidHistoryService.getBossRaidStatus();
  }

  @Post('enter')
  enterBossRaid(@Body() enterBossRaidDto: EnterBossRaidDto) {
    return this.bossRaidHistoryService.enterBossRaid(enterBossRaidDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bossRaidHistoryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBossRaidHistoryDto: UpdateBossRaidHistoryDto,
  ) {
    return this.bossRaidHistoryService.update(+id, updateBossRaidHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bossRaidHistoryService.remove(+id);
  }
}
