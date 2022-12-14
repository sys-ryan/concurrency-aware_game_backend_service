import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BossRaidAvailability,
  BossRaidHistoryService,
} from './boss-raid-history.service';
import { BossRaidHistory } from './entities/boss-raid-history.entity';
import { DataSource } from 'typeorm';
import { UserService } from '../user/user.service';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  CACHE_MANAGER,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';

const bossRaidHistories: BossRaidHistory[] = [];

let bossRaidAvailability: BossRaidAvailability;

const users: User[] = [];

const mockCacheManager = () => ({
  get: jest.fn().mockImplementation((key) => {
    if (key === 'bossRaidAvailability') {
      return bossRaidAvailability;
    }

    if (key === 'bossRaidsStaticData') {
      return {
        bossRaidLimitSeconds: 180,
        levels: [
          {
            level: 0,
            score: 20,
          },
          {
            level: 1,
            score: 47,
          },
          {
            level: 2,
            score: 85,
          },
        ],
      };
    }
  }),
});

const mockBossRaidHistoryRepository = () => ({
  findOne: jest.fn().mockImplementation(async (query) => {
    const where = query.where;

    let existingHistory: BossRaidHistory;

    if (where.raidRecordId) {
      existingHistory = bossRaidHistories.find(
        (history) => history.raidRecordId === where.raidRecordId,
      );
    }

    return existingHistory;
  }),
  save: jest.fn(),
});

const mockDataSource = () => ({});

const mockUserService = () => ({
  findById: jest.fn().mockImplementation(async (id: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }),
});

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

  afterEach(async () => {
    bossRaidHistories.splice(0, bossRaidHistories.length);
    bossRaidAvailability = null;
    users.splice(0, users.length);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('??????????????? ?????? ??????', () => {
    it('?????????????????? ????????? ????????? ????????? {canEnter:true} ??????', async () => {
      const status = await service.getBossRaidStatus();

      expect(status.canEnter).toBe(true);
      expect(status.enteredUserId).not.toBeDefined();
    });

    it('?????????????????? ??????????????? ????????? ????????? {canEnter: false} ??????', async () => {
      bossRaidAvailability = {
        canEnter: false,
        enteredAt: new Date(),
        userId: 1,
      };

      const status = await service.getBossRaidStatus();

      expect(status).toBeDefined();
      expect(status.canEnter).toBe(false);
      expect(status.enteredUserId).toBe(1);
    });

    it('????????? ????????? ?????????????????? ????????? ?????? ?????? ?????? ?????????????????? {canEnter: true} ??????', async () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 4);

      bossRaidAvailability = {
        canEnter: false,
        enteredAt: date,
        userId: 1,
      };

      const status = await service.getBossRaidStatus();

      expect(status).toBeDefined();
      expect(status.canEnter).toBe(true);
    });
  });

  describe('??????????????? ??????', () => {
    it('???????????? ?????? userId??? ????????? ?????? ??????', async () => {
      await expect(
        service.enterBossRaid({ userId: 999, level: 0 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('???????????? ?????? level??? ????????? ?????? ??????', async () => {
      users.push({ id: 1, bossRaidHistory: [] });
      await expect(
        service.enterBossRaid({ userId: 1, level: 999 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('{canEnter: false}??? ??? ?????? ????????? {isEntered: false} ??????', async () => {
      users.push({ id: 1, bossRaidHistory: [] });

      bossRaidAvailability = {
        canEnter: false,
        enteredAt: new Date(),
        userId: 1,
      };

      const response = await service.enterBossRaid({ userId: 1, level: 0 });

      expect(response).toBeDefined();
      expect(response.isEntered).toBe(false);
    });
  });

  describe('??????????????? ??????', () => {
    it('????????? userId??? raidRecordId??? ???????????? user ???????????? ?????? ????????????', async () => {
      bossRaidHistories.push({
        raidRecordId: 1,
        level: 0,
        user: { id: 1, bossRaidHistory: [] },
        enterTime: new Date(),
        endTime: null,
        score: 0,
      });

      await expect(
        service.endBossRaid({ raidRecordId: 1, userId: 999 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('???????????? ?????? raidRecordId??? ?????? ????????????', async () => {
      bossRaidHistories.push({
        raidRecordId: 1,
        level: 0,
        user: { id: 1, bossRaidHistory: [] },
        enterTime: new Date(),
        endTime: null,
        score: 0,
      });

      await expect(
        service.endBossRaid({ raidRecordId: 999, userId: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('?????? ????????? ???????????? ?????? ????????????', async () => {
      users.push({ id: 1, bossRaidHistory: [] });

      bossRaidHistories.push({
        raidRecordId: 1,
        level: 0,
        user: { id: 1, bossRaidHistory: [] },
        enterTime: new Date(),
        endTime: new Date(),
        score: 0,
      });

      await expect(
        service.endBossRaid({ raidRecordId: 1, userId: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('????????? ?????????????????? ????????? ??????????????? ???????????? ????????????', async () => {
      users.push({ id: 1, bossRaidHistory: [] });

      const endTime = new Date();
      const bossRaidLimitSeconds = 180;

      endTime.setSeconds(endTime.getSeconds() - (bossRaidLimitSeconds + 60));
      bossRaidHistories.push({
        raidRecordId: 1,
        level: 0,
        user: { id: 1, bossRaidHistory: [] },
        enterTime: new Date(),
        endTime,
        score: 0,
      });

      await expect(
        service.endBossRaid({ raidRecordId: 1, userId: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
