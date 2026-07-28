import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let serviceMock: Record<string, jest.Mock>;

  const mockUserRequest = {
    user: {
      userId: '1',
      email: 'test@example.com',
    },
  } as Parameters<UsersController['getMyCreditLimit']>[0];

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
    serviceMock.getCreditLimitByUserId.mockResolvedValue({});
    await controller.getMyCreditLimit(mockUserRequest);
    expect(serviceMock.getCreditLimitByUserId).toHaveBeenCalledWith('1');
  });

  it('should call useCreditLimit', async () => {
    serviceMock.useCredit.mockResolvedValue({});
    await controller.useCreditLimit(mockUserRequest, 100);
    expect(serviceMock.useCredit).toHaveBeenCalledWith('1', 100);
  });

  it('should call applyForLimitIncrease', async () => {
    serviceMock.applyForLimitIncrease.mockResolvedValue({});
    await controller.applyForLimitIncrease(mockUserRequest, {
      requestedAmount: 500,
    });
    expect(serviceMock.applyForLimitIncrease).toHaveBeenCalledWith('1', 500);
  });
});
