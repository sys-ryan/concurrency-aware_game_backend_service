import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

/**
 * 보스레이드 랭킹 조회 request body
 */
export class GetRankingInfoListDto {
  @ApiProperty({ description: '랭킹을 조회하고자 하는 유저 id', minimum: 1 })
  @IsNumber()
  userId: number;
}

/**
 * 보스레이드 랭킹 Info
 */
export class RankingInfo {
  @ApiProperty({ description: '유저의 보스레이드 랭킹 (1등 == 0)' })
  rainking: number;

  @ApiProperty({ description: '유정 id', minimum: 1 })
  userId: number;

  @ApiProperty({ description: '유저의 보스레이드 총 점수' })
  totalScore: number;
}

/**
 * 보스레이드 랭킹 조회 response
 */
export class GetRankingInfoListResponseDto {
  @ApiProperty({ description: '전체 보스레이드 랭킹 리스트' })
  topRankerInfoList: RankingInfo[];

  @ApiProperty({ description: '조회한 userId에 해당하는 유저의 랭킹 정보' })
  myRankingInfo: RankingInfo;
}
