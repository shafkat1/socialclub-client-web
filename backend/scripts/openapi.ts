import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Club API')
    .setDescription('Map-first drink purchasing platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addBasicAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outDir = join(process.cwd(), 'openapi');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'openapi.json');
  writeFileSync(outFile, JSON.stringify(document, null, 2));
  // eslint-disable-next-line no-console
  console.log(`✅ OpenAPI written to ${outFile}`);

  await app.close();
}

generateOpenApi().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate OpenAPI spec', err);
  process.exit(1);
});


