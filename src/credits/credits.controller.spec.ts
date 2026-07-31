import { Test, TestingModule } from '@nestjs/testing';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';

describe('CreditsController', () => {
  let controller: CreditsController;
  let serviceMock: Record<string, jest.Mock>;

  const mockUserRequest = {
    user: {
      userId: '1',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    serviceMock = {
      applyForCredit: jest.fn(),
      getMyCredits: jest.fn(),
      getCreditById: jest.fn(),
      getPaymentPlansByCreditId: jest.fn(),
      calculateRepayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditsController],
      providers: [
        {
          provide: CreditsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

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
    serviceMock.applyForCredit.mockResolvedValue({});
    await controller.applyForCredit(mockUserRequest, {
      amount: 1000,
      termCount: 6,
    });
    expect(serviceMock.applyForCredit).toHaveBeenCalledWith('1', {
      amount: 1000,
      termCount: 6,
    });
  });

  it('should call getMyCredits', async () => {
    serviceMock.getMyCredits.mockResolvedValue([]);
    await controller.getMyCredits(mockUserRequest);
    expect(serviceMock.getMyCredits).toHaveBeenCalledWith('1');
  });

  it('should call getCreditById', async () => {
    serviceMock.getCreditById.mockResolvedValue({});
    await controller.getCreditById(mockUserRequest, 'credit-1');
    expect(serviceMock.getCreditById).toHaveBeenCalledWith('1', 'credit-1');
  });

  it('should call getPaymentPlans', async () => {
    serviceMock.getPaymentPlansByCreditId.mockResolvedValue([]);
    await controller.getPaymentPlans(mockUserRequest, 'credit-1');
    expect(serviceMock.getPaymentPlansByCreditId).toHaveBeenCalledWith(
      '1',
      'credit-1',
    );
  });
});
