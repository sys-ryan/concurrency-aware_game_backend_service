import { IsNumber } from 'class-validator';

/**
 * 보스레이드 랭킹 조회 request body
 */
export class GetRankingInfoListDto {
  @IsNumber()
  userId: number;
}
