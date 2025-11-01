import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DevicesService } from './devices.service';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async register(
    @Request() req: any,
    @Body()
    body: {
      deviceId?: string;
      deviceToken: string; // FCM/APNs
      platform: 'ios' | 'android' | 'web';
      appVersion?: string;
    },
  ) {
    const userId = req.user?.sub;
    await this.devices.registerDevice(userId, body);
    return { success: true };
  }
}


