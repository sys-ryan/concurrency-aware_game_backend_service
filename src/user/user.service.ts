import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateUserResponseDto } from './dto/create-user.dto';
import { BossRaidHistoryType, FindUserResponseDto } from './dto/find-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * User를 생성하고 생성된 user의 id를 반환합니다.
   * @returns { userId }
   */
  async create(): Promise<CreateUserResponseDto> {
    const user = await this.userRepository.create();
    await this.userRepository.save(user);
    return {
      userId: user.id,
    };
  }

  /**
   * User의 totalScore와 bossRaidHistory를 조회합니다.
   * @param id user id
   * @returns { totalScore, bossRaidHistory }
   */
  async findOne(id: number): Promise<FindUserResponseDto> {
    const query = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoin('user.bossRaidHistory', 'brh')
      .addSelect('brh', 'bossRaidHistory')
      .where('user.id = :id', { id });

    const result = await query.execute();

    // 존재하지 않는 user id의 경우 예외 처리
    if (result.length === 0) {
      throw new NotFoundException(`User (id: ${id}) not found.`);
    }

    const bossRaidHistory: BossRaidHistoryType[] = [];

    let totalScore = 0;

    // bossRaidHistory가 있을 경우 totalScore를 'SUM' 으로 계산
    if (result[0].brh_score) {
      const score = await query
        .select('SUM(brh.score)', 'sum')
        .where('user.id = :id', { id })
        .execute();

      totalScore = +score[0].sum;

      // format result
      result.forEach((history) => {
        bossRaidHistory.push({
          raidRecordId: history.brh_raidRecordId,
          score: history.brh_score,
          enterTime: (
            new Date(history.brh_enter_time).getTime() / 1000
          ).toFixed(0), // datetime 을 unix timestamp 로 변환
          endTime: (new Date(history.brh_end_time).getTime() / 1000).toFixed(0), // datetime 을 unix timestamp 로 변환
        });
      });
    }

    return {
      totalScore,
      bossRaidHistory,
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User (id: ${id}) not found.`);
    }

    return user;
  }
}
