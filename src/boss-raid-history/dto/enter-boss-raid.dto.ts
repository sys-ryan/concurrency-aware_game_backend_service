import { IsNumber, IsPositive, Min } from 'class-validator';

/**
 * 보스레이드 시작 request body
 */
export class EnterBossRaidDto {
  @IsNumber()
  @IsPositive()
  userId: number;

  @IsNumber()
  @Min(0)
  level: number;
}

/**
 * 보스레이드 시작 response
 */
export class EnterBossRaidResponseDto {
  isEntered: boolean;

  raidRecordId: number;
}
