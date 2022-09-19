import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

/**
 * 보스레이드 시작 request body
 */
export class EnterBossRaidDto {
  @ApiProperty({ description: '보스레이드 시작 유저 id', minimum: 1 })
  @IsNumber()
  @IsPositive()
  userId: number;

  @ApiProperty({ description: '보스레이드 레벨' })
  @IsNumber()
  @Min(0)
  level: number;
}

/**
 * 보스레이드 시작 response
 */
export class EnterBossRaidResponseDto {
  @ApiProperty({ description: '보스레이드 입장 여부' })
  isEntered: boolean;

  @ApiProperty({ description: '보스레이드 recordId', minimum: 1 })
  @ApiPropertyOptional()
  raidRecordId: number;
}
