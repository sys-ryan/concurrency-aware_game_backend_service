import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * 보스레이드 종료 request body
 */
export class EndBossRaidDto {
  @ApiProperty({ description: '보스레이드를 플레이한 유저 id', minimum: 1 })
  @IsNumber()
  @Min(1)
  userId: number;

  @ApiProperty({ description: '보스레이드 recordId', minimum: 1 })
  @IsNumber()
  @Min(1)
  raidRecordId: number;
}
