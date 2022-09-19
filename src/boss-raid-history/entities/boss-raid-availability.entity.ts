import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BossRaidAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'can_enter',
    comment:
      '이 컬럼은 유저가 보스레이드를 시작할 수 있는지 여부를 나타냅니다.',
  })
  canEnter: boolean;

  @Column({
    type: 'datetime',
    name: 'entered_at',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '이 컬럼은 유저가 보스레이드를 시작한 시간을 나타냅니다.',
  })
  enteredAt: Date;

  @Column({
    type: 'int',
    name: 'user_id',
    default: null,
    comment: '이 컬럼은 보스레이드를 플레이하고 있는 유저의 id를 나타냅니다.',
  })
  userId: number;
}
