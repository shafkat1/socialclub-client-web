import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, RedisService],
  exports: [OrdersService],
})
export class OrdersModule {}
