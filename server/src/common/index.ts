import {
  createParamDecorator,
  CustomDecorator,
  ExecutionContext,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
  SetMetadata
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export interface UserData {
  jti: string;
  id: number;
}
export const Claims = createParamDecorator<any, any, UserData>(
  (data: string, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user
);

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.cookies?.[data] : request.cookies;
});

@Injectable()
export class Db extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  async onModuleInit() {
    await this.$connect();
  }

  async onApplicationShutdown() {
    await this.$disconnect();
  }
}

@Injectable()
export class Redis implements OnModuleInit, OnApplicationShutdown {
  client: RedisClientType<any, any, any>;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.client = await createClient({
      url: this.config.get('REDIS_URL'),
      database: 0
    }).connect();
  }

  async onApplicationShutdown() {
    await this.client.disconnect();
  }
}
