import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BossRaidHistoryService } from './boss-raid-history.service';
import { BossRaidAvailability } from './entities/boss-raid-availability.entity';
import { BossRaidHistory } from './entities/boss-raid-history.entity';
import { DataSource } from 'typeorm';
import { UserService } from '../user/user.service';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/common';

const mockCacheManager = () => ({});

const mockBossRaidHistoryRepository = () => ({});

const mockBossRaidAvailabilityRepository = () => ({});

const mockDataSource = () => ({});

const mockUserService = () => ({});

const mockHttpService = () => ({});

describe('BossRaidHistoryService', () => {
  let service: BossRaidHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BossRaidHistoryService,
        {
          provide: getRepositoryToken(BossRaidHistory),
          useValue: mockBossRaidHistoryRepository(),
        },
        {
          provide: getRepositoryToken(BossRaidAvailability),
          useValue: mockBossRaidAvailabilityRepository(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager(),
        },
        {
          provide: DataSource,
          useValue: mockDataSource(),
        },
        {
          provide: UserService,
          useValue: mockUserService(),
        },
        {
          provide: HttpService,
          useValue: mockHttpService(),
        },
      ],
    }).compile();

    service = module.get<BossRaidHistoryService>(BossRaidHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
