import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from './setup-app';
import axios from 'axios';

let user: any;

describe('BossRaid (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    user = (await request(app.getHttpServer()).post('/api/v1/user').send())
      .body;
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  describe('보스레이드', () => {
    it('보스레이드 입장 성공시 서버 응답값 검증', async () => {
      const { isEntered, raidRecordId } = (
        await request(app.getHttpServer())
          .post('/api/v1/bossRaid/enter')
          .send({ userId: user.userId, level: 0 })
      ).body;

      expect(isEntered).toBe(true);
      expect(raidRecordId).toBeDefined();

      await request(app.getHttpServer())
        .patch('/api/v1/bossRaid/end')
        .send({ userId: user.userId, raidRecordId });
    });

    it('보스레이드 입장 실패시 서버 응답값 검증', async () => {
      const { isEntered, raidRecordId } = (
        await request(app.getHttpServer())
          .post('/api/v1/bossRaid/enter')
          .send({ userId: user.userId, level: 0 })
      ).body;

      expect(isEntered).toBe(true);
      expect(raidRecordId).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/api/v1/bossRaid/enter')
        .send({ userId: user.userId, level: 0 });

      expect(response.body.isEntered).toBe(false);

      await request(app.getHttpServer())
        .patch('/api/v1/bossRaid/end')
        .send({ userId: user.userId, raidRecordId });
    });

    it('보스레이드 종료시 level에 따른 score 반영 검증', async () => {
      const levels = (
        await axios.get(
          'https://dmpilf5svl7rv.cloudfront.net/assignment/backend/bossRaidData.json',
        )
      ).data.bossRaids[0].levels;

      const { isEntered, raidRecordId } = (
        await request(app.getHttpServer())
          .post('/api/v1/bossRaid/enter')
          .send({ userId: user.userId, level: 0 })
      ).body;
      expect(isEntered).toBe(true);
      expect(raidRecordId).toBeDefined();
      await request(app.getHttpServer())
        .patch('/api/v1/bossRaid/end')
        .send({ userId: user.userId, raidRecordId });

      const response = await request(app.getHttpServer())
        .get('/api/v1/bossRaid/topRankerList')
        .send({ userId: user.userId });

      const totalScore = response.body.myRankingInfo.totalScore;

      const expectedScoreAmount = levels.find(
        (level) => level.level === 0,
      ).score;

      expect(totalScore).toEqual(expectedScoreAmount);
    });
  });

  describe('랭킹', () => {
    it('랭킹 정보 조회 서버 응답값 검증', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/bossRaid/topRankerList')
        .send({ userId: user.userId - 1 });

      const myRankingInfo = response.body.myRankingInfo;
      expect(myRankingInfo.userId).toEqual(user.userId - 1);
    });
  });
});
