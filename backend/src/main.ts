import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind a hosting proxy (Hugging Face Spaces, Render…): use the real client IP for rate limiting.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // CORS_ORIGINS: comma-separated list, e.g. "https://rag.fomertech.com,https://my-app.vercel.app".
  // Unset → allow all (local development).
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length ? origins : '*',
    methods: 'GET,POST,OPTIONS',
    allowedHeaders: 'Content-Type,x-admin-token',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on port ${port} (/api)`);
}

bootstrap();
