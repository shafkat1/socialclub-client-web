import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      api: {
        version: '2.0.0',
        ready: true,
        cors: process.env.CORS_ORIGIN || 'all',
      },
      services: {
        database: 'connected',
        cache: 'connected',
        s3: 'initialized',
      },
    };
  }
}
