import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class BossRaidHistory {
  @PrimaryGeneratedColumn()
  raidRecordId: number;

  @Column({
    type: 'int',
    comment:
      '해당 컬럼은 유저가 보스레이드를 클리어하고 얻은 점수를 나타냅니다.',
  })
  score: number;

  @Column({
    type: 'timestamp',
    name: 'enter_time',
    comment: '해당 컬럼은 유저가 보스레이드를 시작한 시간을 나타냅니다.. ',
  })
  enterTime: Date;

  @Column({
    type: 'timestamp',
    name: 'end_time',
    default: null,
    comment: '해당 컬럼은 유저가 보스레이드를 종료한 시간을 나타냅니다. ',
  })
  endTime: Date;

  @Column({
    type: 'int',
    comment: '해당 컬럼은 유저가 플레이한 보스레이드의 레벨을 나타냅니다.',
  })
  level: number;

  @ManyToOne(() => User, (user) => user.bossRaidHistory)
  @JoinColumn()
  user: User;
}
