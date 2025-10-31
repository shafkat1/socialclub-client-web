import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, RedisService],
  exports: [AuthService],
})
export class AuthModule {}
