import { IsNumber } from 'class-validator';

export class GetRankingInfoListDto {
  @IsNumber()
  userId: number;
}
