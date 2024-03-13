import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createClient, RedisClientType } from 'redis';

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
