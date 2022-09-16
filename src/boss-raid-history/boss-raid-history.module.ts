import { Module } from '@nestjs/common';
import { BossRaidHistoryService } from './boss-raid-history.service';
import { BossRaidHistoryController } from './boss-raid-history.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BossRaidAvailability } from './entities/boss-raid-availability.entity';
import { BossRaidHistory } from './entities/boss-raid-history.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BossRaidHistory, BossRaidAvailability]),
    UserModule,
  ],
  controllers: [BossRaidHistoryController],
  providers: [BossRaidHistoryService],
})
export class BossRaidHistoryModule {}
