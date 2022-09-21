import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupApp } from './setup-app';

describe('BossRaid (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('보스레이드', () => {
    it('보스레이드 입장 성공시 서버 응답값 검증', async () => {});

    it('보스레이드 입장 실패시 서버 응답값 검증', async () => {});

    it('보스레이드 종료시 level에 따른 score 반영 검증', async () => {});
  });

  describe('랭킹', () => {});
});
