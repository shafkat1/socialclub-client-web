import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';

// Deployment trigger - rebuild v118344
// ✅ Workflow trigger point - e8a93ccb-retry

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('Starting NestJS application...');
    const app = await NestFactory.create(AppModule);
    logger.log('✅ AppModule created');

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
          const formatted = errors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints || {}).join(', '),
          }));
          return new BadRequestException(formatted);
        },
      }),
    );
    logger.log('✅ Global validation pipe configured');

    // CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    });
    logger.log('✅ CORS enabled');

    // ✅ SET GLOBAL PREFIX FOR ALL API ROUTES
    app.setGlobalPrefix('api');
    logger.log('✅ Global API prefix set to /api');

    // Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 0.1,
      });
      logger.log('✅ Sentry error tracking initialized');
    }

    // Swagger
    if (process.env.SWAGGER_ENABLED !== 'false') {
      const config = new DocumentBuilder()
        .setTitle('Club API')
        .setDescription('Map-first drink purchasing platform API')
        .setVersion('1.0.0')
        .addBearerAuth()
        .addBasicAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      // Expose raw OpenAPI JSON for SDK generation
      const http = app.getHttpAdapter();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (http as any).get?.('/api/openapi.json', (_req: unknown, res: any) => res.json(document));
      logger.log('✅ Swagger documentation enabled at /api/docs');
      logger.log('✅ OpenAPI JSON available at /api/openapi.json');
    }

    const port = process.env.PORT || 3000;
    logger.log(`Attempting to listen on port ${port}...`);
    
    await app.listen(port);
    
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🚀 CLUBAPP BACKEND STARTED SUCCESSFULLY');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log(`📡 Server running on http://localhost:${port}`);
    logger.log(`🌐 API base URL: http://localhost:${port}/api`);
    logger.log(`📚 API docs: http://localhost:${port}/api/docs`);
    logger.log(`🗄️  Database: Connected and ready`);
    logger.log(`🔐 CORS Origin: ${process.env.CORS_ORIGIN || 'All origins'}`);
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ FATAL ERROR during bootstrap:', error);
    logger.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Unhandled bootstrap error:', error);
  process.exit(1);
});
// Deployment ready
// Rebuild trigger 10/31/2025 08:41:41
// Deployment trigger - rebuild v118344
// Lock bypass fix applied
// refresh-only fix
// Docker cache fix
// Docker no-cache fix
// Dockerfile fix
// Lock cleanup v2
// Plan fallback
// Docker simplify
// Build fix v2
// Prod stage fix
// ECS deploy fix
// deploy-trigger: mobile-scaffold-sync






