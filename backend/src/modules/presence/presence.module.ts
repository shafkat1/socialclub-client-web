import { Module } from '@nestjs/common';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@Module({
  controllers: [PresenceController],
  providers: [PresenceService, PrismaService, RedisService],
  exports: [PresenceService],
})
export class PresenceModule {}
