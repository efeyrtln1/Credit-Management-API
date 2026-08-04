import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyGuard } from './idempotency.guard';
import { REDIS_CLIENT } from '../redis/redis.module';
import { BadRequestException, ConflictException, ExecutionContext } from '@nestjs/common';

describe('IdempotencyGuard', () => {
  let guard: IdempotencyGuard;
  let redisMock: { set: jest.Mock };

  beforeEach(async () => {
    redisMock = { set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyGuard,
        { provide: REDIS_CLIENT, useValue: redisMock },
      ],
    }).compile();

    guard = module.get<IdempotencyGuard>(IdempotencyGuard);
  });

  const createMockContext = (headers: Record<string, any>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as any);

  it('X-Idempotency-Key eksikse BadRequestException fırlatmalı', async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('Kilit başarıyla alınırsa true dönmeli', async () => {
    redisMock.set.mockResolvedValue('OK');
    const context = createMockContext({ 'x-idempotency-key': 'test-key' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('Kilit zaten alınmışsa ConflictException fırlatmalı', async () => {
    redisMock.set.mockResolvedValue(null);
    const context = createMockContext({ 'x-idempotency-key': 'test-key' });
    await expect(guard.canActivate(context)).rejects.toThrow(ConflictException);
  });
});