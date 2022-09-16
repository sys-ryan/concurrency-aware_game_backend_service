import { PartialType } from '@nestjs/swagger';
import { CreateBossRaidHistoryDto } from './create-boss-raid-history.dto';

export class UpdateBossRaidHistoryDto extends PartialType(CreateBossRaidHistoryDto) {}
