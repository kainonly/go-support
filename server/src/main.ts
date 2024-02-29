/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app/app.module';

(async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      connectionTimeout: 15 * 1000,
      jsonShorthand: false
    })
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true
    })
  );
  const port = process.env.PORT || 6000;
  await app.listen(port);
})();
