import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let serviceMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    serviceMock = {
      getCreditLimitByUserId: jest.fn(),
      useCredit: jest.fn(),
      applyForLimitIncrease: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getMyCreditLimit', async () => {
    const req = { user: { userId: '1' } } as any;
    serviceMock.getCreditLimitByUserId.mockResolvedValue({});
    await controller.getMyCreditLimit(req);
    expect(serviceMock.getCreditLimitByUserId).toHaveBeenCalledWith('1');
  });

  it('should call useCreditLimit', async () => {
    const req = { user: { userId: '1' } } as any;
    serviceMock.useCredit.mockResolvedValue({});
    await controller.useCreditLimit(req, 100);
    expect(serviceMock.useCredit).toHaveBeenCalledWith('1', 100);
  });

  it('should call applyForLimitIncrease', async () => {
    const req = { user: { userId: '1' } } as any;
    serviceMock.applyForLimitIncrease.mockResolvedValue({});
    await controller.applyForLimitIncrease(req, { requestedAmount: 500 });
    expect(serviceMock.applyForLimitIncrease).toHaveBeenCalledWith('1', 500);
  });
});