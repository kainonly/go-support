import { Injectable } from '@nestjs/common';

import { Claims } from './types';

@Injectable()
export class AppService {
  async verify({ jti }: any): Promise<Claims> {
    return { jti };
  }
}
