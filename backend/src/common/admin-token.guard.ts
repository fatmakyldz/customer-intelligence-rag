import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Protects write endpoints on a public demo. When ADMIN_TOKEN is set, the
 * request must send the same value in the `x-admin-token` header.
 * When ADMIN_TOKEN is not set (local development), the endpoint stays open.
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) return true;

    const request = context.switchToHttp().getRequest();
    const provided = String(request.headers['x-admin-token'] ?? '');

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Adding documents requires the admin token.');
    }
    return true;
  }
}
