import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

const users: User[] = [];

const mockUserRepository = () => ({
  create: jest.fn().mockImplementation(() => ({
    id: Math.random(),
  })),
  save: jest.fn().mockImplementation((user) => {
    users.push(user);
  }),
  findOne: jest.fn(),
});

const mockDataSource = () => ({});

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository(),
        },
        {
          provide: DataSource,
          useValue: mockDataSource(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('유저 생성 기능', async () => {
    const user = await service.create();
    console.log(user);
    expect(user).toBeDefined();
  });

  it('유저 생성시 고유한 id 생성 검증', async () => {
    const user1 = await service.create();
    const user2 = await service.create();
    const user3 = await service.create();

    expect(user1.userId).not.toEqual(user2.userId);
    expect(user1.userId).not.toEqual(user3.userId);
    expect(user2.userId).not.toEqual(user3.userId);
  });
});
