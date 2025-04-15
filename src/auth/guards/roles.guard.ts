import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../dto/user-role.enum';
import { GqlExecutionContext } from '@nestjs/graphql';

interface GqlContext {
  req: {
    user?: {
      id?: string;
      username?: string;
      role?: UserRole;
    };
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();
    const user = gqlContext.req?.user;

    if (!user?.role) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
