import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app/app.module';

(async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true
    })
  );
  const port = process.env.PORT || 3000;
  await app.listen(port);
})();
