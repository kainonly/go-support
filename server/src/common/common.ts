import { createParamDecorator, CustomDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

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
