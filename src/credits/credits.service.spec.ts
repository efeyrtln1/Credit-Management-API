import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { Credit } from './entities/credit.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { UsersService } from '../users/users.service';

describe('CreditsService', () => {
  let service: CreditsService;
  let usersServiceMock: Record<string, jest.Mock>;
  let creditRepoMock: Record<string, jest.Mock>;
  let paymentPlanRepoMock: Record<string, jest.Mock>;
  let queryRunnerMock: Partial<QueryRunner>;

  beforeEach(async () => {
    usersServiceMock = {
      getCreditLimitByUserId: jest.fn(),
    };

    creditRepoMock = {
      create: jest.fn().mockImplementation((dto: Partial<Credit>) => ({
        id: 'credit-1',
        ...dto,
      })),
      find: jest.fn(),
    };

    paymentPlanRepoMock = {
      create: jest.fn().mockImplementation((dto: Partial<PaymentPlan>) => dto),
    };

    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest
          .fn()
          .mockImplementation((_entityOrClass: unknown, entity?: unknown) => {
            return Promise.resolve(entity ?? _entityOrClass);
          }),
      } as unknown as QueryRunner['manager'],
    };

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        {
          provide: getRepositoryToken(Credit),
          useValue: creditRepoMock,
        },
        {
          provide: getRepositoryToken(PaymentPlan),
          useValue: paymentPlanRepoMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<CreditsService>(CreditsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('applyForCredit', () => {
    it('should throw BadRequestException if available limit is insufficient', async () => {
      usersServiceMock.getCreditLimitByUserId.mockResolvedValue({
        availableLimit: 1000,
      });

      await expect(
        service.applyForCredit('user-1', { amount: 2000, termCount: 6 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve credit and generate payment plans if limit is sufficient', async () => {
      usersServiceMock.getCreditLimitByUserId.mockResolvedValue({
        availableLimit: 5000,
        usedAmount: 0,
      });

      const result = await service.applyForCredit('user-1', {
        amount: 2000,
        termCount: 6,
      });

      expect(result.message).toContain('başarıyla onaylandı');
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('getMyCredits', () => {
    it('should return credits for given user', async () => {
      creditRepoMock.find.mockResolvedValue([]);
      const result = await service.getMyCredits('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('calculateRepayment', () => {
    it('should calculate repayment schedule and late fee projections correctly for default group', async () => {
      const result = await service.calculateRepayment(10000, 6);

      expect(result.amount).toBe(10000);
      expect(result.termCount).toBe(6);
      expect(result.scoreGroup).toBe('D');
      expect(result.schedule).toHaveLength(6);
      expect(result.schedule[0].lateAmounts).toHaveLength(2);
      expect(result.schedule[0].lateAmounts[0].daysLate).toBe(7);
      expect(result.schedule[0].lateAmounts[1].daysLate).toBe(30);
    });

    it('should calculate correctly for custom score group A', async () => {
      const result = await service.calculateRepayment(5000, 3, 'A');

      expect(result.scoreGroup).toBe('A');
      expect(result.interestRate).toBe(0.015);
      expect(result.lateFeeRate).toBe(0.0005);
      expect(result.schedule).toHaveLength(3);
    });
  });
});