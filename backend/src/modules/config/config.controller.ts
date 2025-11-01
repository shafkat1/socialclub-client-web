import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Config')
@Controller('config')
export class AppConfigController {
  @Get()
  getConfig() {
    return {
      environment: process.env.NODE_ENV || 'development',
      apiVersion: 'v1',
      minimumAppVersion: {
        ios: '1.0.0',
        android: '1.0.0',
        web: '1.0.0',
      },
      featureFlags: {
        newCheckout: false,
        bartenderMode: true,
      },
      sentry: {
        dsn: process.env.SENTRY_WEB_DSN || process.env.SENTRY_DSN || '',
      },
    };
  }
}


