import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, PrismaService],
  exports: [GroupsService],
})
export class GroupsModule {}
