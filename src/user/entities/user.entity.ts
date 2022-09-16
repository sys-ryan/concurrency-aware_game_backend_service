import { BossRaidHistory } from 'src/boss-raid-history/entities/boss-raid-history.entity';
import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => BossRaidHistory, (bossRaidHistory) => bossRaidHistory.user)
  bossRaidHistories: BossRaidHistory[];
}
