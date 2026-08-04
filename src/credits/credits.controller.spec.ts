import { Test, TestingModule } from '@nestjs/testing';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../common/guards/idempotency.guard';

describe('CreditsController', () => {
  let controller: CreditsController;
  let serviceMock: Record<string, jest.Mock>;

  const mockUserRequest = {
    user: {
      id: '1',
      userId: '1',
      sub: '1',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    serviceMock = {
      applyForCredit: jest.fn().mockResolvedValue({}),
      getMyCredits: jest.fn().mockResolvedValue([]),
      getCreditById: jest.fn().mockResolvedValue({}),
      getPaymentPlansByCreditId: jest.fn().mockResolvedValue([]),
      calculateRepayment: jest.fn().mockReturnValue({}),
      payPaymentPlan: jest.fn().mockResolvedValue({ message: 'Success' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditsController],
      providers: [
        {
          provide: CreditsService,
          useValue: serviceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(IdempotencyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CreditsController>(CreditsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call calculateRepayment', () => {
    const mockCalculation = { amount: 10000, termCount: 6, schedule: [] };
    serviceMock.calculateRepayment.mockReturnValue(mockCalculation);

    const result = controller.calculateRepayment('10000', '6', 'A');

    expect(serviceMock.calculateRepayment).toHaveBeenCalledWith(10000, 6, 'A');
    expect(result).toEqual(mockCalculation);
  });

  it('should call applyForCredit', async () => {
    await controller.applyForCredit(mockUserRequest as any, {
      amount: 1000,
      termCount: 6,
    });
    expect(serviceMock.applyForCredit).toHaveBeenCalledWith('1', {
      amount: 1000,
      termCount: 6,
    });
  });

  it('should call getMyCredits', async () => {
    await controller.getMyCredits(mockUserRequest as any);
    expect(serviceMock.getMyCredits).toHaveBeenCalledWith('1');
  });

  it('should call getCreditById', async () => {
    await controller.getCreditById(mockUserRequest as any, 'credit-1');
    expect(serviceMock.getCreditById).toHaveBeenCalledWith('1', 'credit-1');
  });

  it('should call getPaymentPlans', async () => {
    await controller.getPaymentPlans(mockUserRequest as any, 'credit-1');
    expect(serviceMock.getPaymentPlansByCreditId).toHaveBeenCalledWith(
      '1',
      'credit-1',
    );
  });

  it('should call payPaymentPlan', async () => {
    await controller.payPaymentPlan(mockUserRequest as any, 'plan-1');
    expect(serviceMock.payPaymentPlan).toHaveBeenCalledWith('plan-1', '1');
  });
});