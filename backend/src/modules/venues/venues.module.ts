import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, PrismaService, RedisService],
  exports: [VenuesService],
})
export class VenuesModule {}
