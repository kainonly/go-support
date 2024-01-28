import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';

import { UsersModule } from './users.module';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let users: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env'],
          isGlobal: true,
        }),
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (config: ConfigService) => ({ uri: config.get('DATABASE_URL') }),
          inject: [ConfigService],
        }),
        UsersModule,
      ],
    }).compile();

    users = module.get<UsersService>(UsersService);
  });

  it('should be defined', async () => {
    const r = await users.model.create({
      email: 'work@kainonly.com',
      password: await hash('pass@VAN1234'),
    });
    console.log(r);
  });
});
