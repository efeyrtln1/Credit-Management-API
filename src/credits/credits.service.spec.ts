import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { Credit } from './entities/credit.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Payment } from './entities/payment.entity';
import { UsersService } from '../users/users.service';

const REDIS_CLIENT = 'REDIS_CLIENT';

describe('CreditsService', () => {
  let service: CreditsService;
  let creditRepoMock: Record<string, jest.Mock>;
  let paymentPlanRepoMock: Record<string, jest.Mock>;
  let paymentRepoMock: Record<string, jest.Mock>;
  let queryRunnerMock: Partial<QueryRunner>;

  beforeEach(async () => {
    creditRepoMock = {
      create: jest.fn().mockImplementation((dto: Partial<Credit>) => ({
        id: 'credit-1',
        ...dto,
      })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    paymentPlanRepoMock = {
      create: jest.fn().mockImplementation((dto: Partial<PaymentPlan>) => dto),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    paymentRepoMock = {
      create: jest.fn().mockImplementation((dto: Partial<Payment>) => ({
        id: 'payment-1',
        ...dto,
      })),
      save: jest.fn(),
    };

    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        save: jest
          .fn()
          .mockImplementation((_entityOrClass: unknown, entity?: unknown) => {
            return Promise.resolve(entity ?? _entityOrClass);
          }),
        create: jest
          .fn()
          .mockImplementation((_entityClass: unknown, dto: unknown) => dto),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
      } as unknown as QueryRunner['manager'],
    };

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
    };

    const redisMock = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
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
          provide: getRepositoryToken(Payment),
          useValue: paymentRepoMock,
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: REDIS_CLIENT,
          useValue: redisMock,
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
      (queryRunnerMock.manager?.findOne as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        availableLimit: 1000,
        usedAmount: 0,
        scoreGroup: 'A',
      });

      await expect(
        service.applyForCredit('user-1', { amount: 2000, termCount: 6 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve credit and generate payment plans if limit is sufficient', async () => {
      (queryRunnerMock.manager?.findOne as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        availableLimit: 5000,
        usedAmount: 0,
        scoreGroup: 'A',
      });

      const result = await service.applyForCredit('user-1', {
        amount: 2000,
        termCount: 6,
      });

      expect(result.message).toContain('başarıyla onaylandı');
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('payPaymentPlan', () => {
    it('should process payment successfully for valid installment', async () => {
      const mockPlan = {
        id: 'plan-1',
        creditId: 'credit-1',
        installmentNo: 1,
        amount: 500,
        dueDate: '2026-12-31',
        status: 'UNPAID',
        credit: { userId: 'user-1', amount: 3000 },
      };

      paymentPlanRepoMock.findOne
        .mockResolvedValueOnce(mockPlan)
        .mockResolvedValueOnce(null);

      const result = await service.payPaymentPlan('plan-1', 'user-1');

      expect(result.message).toContain('başarıyla gerçekleştirildi');
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

  describe('getCreditById', () => {
    it('should return credit if found', async () => {
      const mockCredit = { id: 'credit-1', userId: 'user-1' };
      creditRepoMock.findOne.mockResolvedValue(mockCredit);

      const result = await service.getCreditById('user-1', 'credit-1');
      expect(result).toEqual(mockCredit);
    });

    it('should throw NotFoundException if credit not found', async () => {
      creditRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.getCreditById('user-1', 'credit-99'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentPlansByCreditId', () => {
    it('should return payment plans and attach currentLate for late/past-due plans', async () => {
      const mockCredit = { id: 'credit-1', userId: 'user-1' } as Credit;
      jest.spyOn(service, 'getCreditById').mockResolvedValue(mockCredit);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const mockPlans = [
        {
          id: 'plan-1',
          creditId: 'credit-1',
          installmentNo: 1,
          amount: 1000,
          dueDate: pastDate.toISOString().split('T')[0],
          status: 'UNPAID',
          lateFeeRate: 0.0015,
        },
      ];

      paymentPlanRepoMock.find.mockResolvedValue(mockPlans);

      const result = await service.getPaymentPlansByCreditId(
        'user-1',
        'credit-1',
      );

      const firstPlan = result[0] as (typeof result)[0] & {
        currentLate: { daysLate: number; lateFee: number; totalDue: number };
      };

      expect(result).toHaveLength(1);
      expect(firstPlan.status).toBe('LATE');
      expect(firstPlan).toHaveProperty('currentLate');
      expect(firstPlan.currentLate.daysLate).toBeGreaterThan(0);
    });
  });

  describe('calculateRepayment', () => {
    it('should calculate repayment schedule and late fee projections correctly for default group', () => {
      const result = service.calculateRepayment(10000, 6);

      expect(result.amount).toBe(10000);
      expect(result.termCount).toBe(6);
      expect(result.scoreGroup).toBe('D');
      expect(result.schedule).toHaveLength(6);
      expect(result.schedule[0].lateAmounts).toHaveLength(2);
      expect(result.schedule[0].lateAmounts[0].daysLate).toBe(7);
      expect(result.schedule[0].lateAmounts[1].daysLate).toBe(30);
    });

    it('should calculate correctly for custom score group A', () => {
      const result = service.calculateRepayment(5000, 3, 'A');

      expect(result.scoreGroup).toBe('A');
      expect(result.interestRate).toBe(0.015);
      expect(result.lateFeeRate).toBe(0.0005);
      expect(result.schedule).toHaveLength(3);
    });
  });
});
