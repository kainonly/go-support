import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { FastifyRequest } from 'fastify';

import { IS_PUBLIC_KEY, Redis, UserData } from './';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private redis: Redis, private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    let data: UserData;
    try {
      data = await this.jwt.verifyAsync<UserData>(token);
      const key = `sessions:${data.id}`;
      if (data.jti !== (await this.redis.client.get(key))) {
        return false;
      }
      await this.redis.client.expire(key, 900);
      request['user'] = data;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  // private extractTokenFromHeader(request: FastifyRequest): string | undefined {
  //   const [type, token] = request.headers.authorization?.split(' ') ?? [];
  //   return type === 'Bearer' ? token : undefined;
  // }

  private extractTokenFromCookie(request: FastifyRequest): string {
    return request.cookies['access_token'];
  }
}
