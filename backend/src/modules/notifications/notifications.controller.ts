import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async sendTest(@Request() req: any, @Body() body: { message?: string }) {
    const userId = req.user?.sub;
    const message = body?.message || 'Hello from ClubApp!';
    return this.svc.sendTest(userId, message);
  }
}


