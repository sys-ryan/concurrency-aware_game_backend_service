import { ApiProperty } from '@nestjs/swagger';

export class BossRaidHistoryType {
  @ApiProperty({ description: '보스레이드 record id' })
  raidRecordId: number;

  @ApiProperty({ description: '보스레이드로 얻은 점수' })
  score: number;

  @ApiProperty({ description: '보스레이드 시작 시간' })
  enterTime: string;

  @ApiProperty({ description: '보스레이드 종료 시간' })
  endTime: string;
}

/**
 * 유저 정보 조회 response 구조
 */
export class FindUserResponseDto {
  @ApiProperty({ description: '유저의 보스레이드 총 점수' })
  totalScore: number;

  @ApiProperty({ description: '유저의 보스레이드 참여 기록' })
  bossRaidHistory: BossRaidHistoryType[];
}
