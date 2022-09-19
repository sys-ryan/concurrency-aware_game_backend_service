import { IsNumber } from 'class-validator';

/**
 * 보스레이드 랭킹 조회 request body
 */
export class GetRankingInfoListDto {
  @IsNumber()
  userId: number;
}

/**
 * 보스레이드 랭킹 Info
 */
export class RankingInfo {
  rainking: number;
  userId: number;
  totalScore: number;
}

/**
 * 보스레이드 랭킹 조회 response
 */
export class GetRankingInfoListResponseDto {
  topRankerInfoList: RankingInfo[];
  myRankingInfo: RankingInfo;
}
