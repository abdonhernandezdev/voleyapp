import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { User } from '../users/user.entity';
import { StreakReminderLog } from './entities/streak-reminder-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, StreakReminderLog])],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
