import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser = require('cookie-parser');
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const express = app.getHttpAdapter().getInstance();

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  express.set('trust proxy', 1);
  express.disable('x-powered-by');
  app.use(cookieParser());

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: envConfig.app.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }

    const origin = req.headers.origin;
    if (!origin || envConfig.app.corsOrigins.includes(origin)) {
      next();
      return;
    }

    res.status(403).json({ statusCode: 403, message: 'Origin no permitido' });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: true,
      disableErrorMessages: envConfig.app.isProduction,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  if (!envConfig.app.isProduction) {
    const config = new DocumentBuilder()
      .setTitle('VoleyApp API')
      .setDescription('API de aprendizaje de voleibol')
      .setVersion('1.0')
      .addCookieAuth(envConfig.auth.cookieName)
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at /api/docs');
  }

  const port = envConfig.app.port;
  await app.listen(port);
  logger.log(`Voley App backend running on port ${port}`);
}

bootstrap();
