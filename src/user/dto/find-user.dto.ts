export interface BossRaidHistoryType {
  raidRecordId: number;

  score: number;

  enterTime: string;

  endTime: string;
}

export class FindUserResponseDto {
  totalScore: number;

  bossRaidHistory: BossRaidHistoryType[];
}
