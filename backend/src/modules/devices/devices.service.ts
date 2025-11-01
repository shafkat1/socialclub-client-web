import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class DevicesService {
  constructor(private readonly redis: RedisService) {}

  async registerDevice(
    userId: string,
    params: { deviceId?: string; deviceToken: string; platform: 'ios' | 'android' | 'web'; appVersion?: string },
  ) {
    const deviceId = params.deviceId || `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const key = `user:${userId}:device:${deviceId}`;
    await this.redis.set(
      key,
      JSON.stringify({
        userId,
        deviceId,
        token: params.deviceToken,
        platform: params.platform,
        appVersion: params.appVersion,
        registeredAt: new Date().toISOString(),
      }),
      0,
    );
    return deviceId;
  }
}


