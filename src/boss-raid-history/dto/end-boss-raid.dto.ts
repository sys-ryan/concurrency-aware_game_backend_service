import { IsNumber, Min } from 'class-validator';

export class EndBossRaidDto {
  @IsNumber()
  @Min(1)
  userId: number;

  @IsNumber()
  @Min(1)
  raidRecordId: number;
}
