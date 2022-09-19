import { IsNumber, Min } from 'class-validator';

/**
 * 보스레이드 종료 request body
 */
export class EndBossRaidDto {
  @IsNumber()
  @Min(1)
  userId: number;

  @IsNumber()
  @Min(1)
  raidRecordId: number;
}
