import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const idempotencyKey = request.headers['x-idempotency-key'];

    if (!idempotencyKey || Array.isArray(idempotencyKey)) {
      throw new BadRequestException(
        'X-Idempotency-Key header bilgisi eksik veya geçersiz.',
      );
    }

    const lockKey = `idempotency:${idempotencyKey}`;

    // Redis SET NX EX (Atomic Lock): Key yoksa 10 saniyeliğine kilitler.
    const acquired = await this.redis.set(lockKey, 'LOCKED', 'EX', 10, 'NX');

    if (!acquired) {
      throw new ConflictException(
        'Bu işlem şu anda işleniyor veya zaten tamamlandı. Lütfen tekrar denemeyin.',
      );
    }

    return true;
  }
}
