import { CacheModule, Module } from '@nestjs/common';
import * as redisCacheStore from 'cache-manager-ioredis';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { BossRaidHistoryModule } from './boss-raid-history/boss-raid-history.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisCacheStore,
      clusterConfig: {
        nodes: [{ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }],
        options: { ttl: 0 },
      },
    }),
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      validationSchema: Joi.object({
        PORT: Joi.number(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    UserModule,
    BossRaidHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
