import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 보스레이드 상태 조회 response
 */
export class GetBossRaidStatusResponseDto {
  @ApiProperty({ description: '보스레이드 입장 가능 여부' })
  canEnter: boolean;

  @ApiProperty({
    description: '현재 보스레이드를 진행중인 유저의 id',
    minimum: 1,
  })
  @ApiPropertyOptional()
  enteredUserId: number;
}
