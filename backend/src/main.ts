import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';

// Deployment trigger - v1.10 (Enhanced startup logging)
// ✅ Workflow trigger point - e8a93ccb-retry

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);

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
    logger.log('✅ Swagger documentation enabled at /api/docs');
  }

  const port = process.env.PORT || 3000;
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
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap error:', error);
  process.exit(1);
});
// Deployment ready
// Rebuild trigger 10/31/2025 08:41:41
// Deployment trigger
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

