import { IsNumber, IsPositive, Min } from 'class-validator';

export class EnterBossRaidDto {
  @IsNumber()
  @IsPositive()
  userId: number;

  @IsNumber()
  @Min(0)
  level: number;
}
