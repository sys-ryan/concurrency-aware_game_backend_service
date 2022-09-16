import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserResponseDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
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

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }
}
