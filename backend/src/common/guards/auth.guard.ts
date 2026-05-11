import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/** 要求 merchant 类型 token */
@Injectable()
export class MerchantGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new ForbiddenException('需要商家权限');
    if (user.jwtPayload?.type !== 'merchant') {
      throw new ForbiddenException('需要商家权限');
    }
    return user;
  }
}

/** 要求 admin 角色 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new ForbiddenException('需要管理员权限');
    if (user.jwtPayload?.type !== 'merchant' || user.role !== 'admin') {
      throw new ForbiddenException('需要管理员权限');
    }
    return user;
  }
}
