import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user payload for active status', () => {
      const payload = {
        sub: '123',
        email: 'test@example.com',
        status: 'ACTIVE',
      };
      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: '123',
        email: 'test@example.com',
        status: 'ACTIVE',
      });
    });

    it('should throw UnauthorizedException if user status is SUSPENDED', () => {
      const payload = {
        sub: '123',
        email: 'test@example.com',
        status: 'SUSPENDED',
      };

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user status is suspend', () => {
      const payload = {
        sub: '123',
        email: 'test@example.com',
        status: 'suspend',
      };

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });
  });
});
