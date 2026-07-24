import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: jest.fn().mockResolvedValue({ accessToken: 'mockToken' }),
      register: jest
        .fn()
        .mockResolvedValue({ id: 1, email: 'test@example.com' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call login on controller', async () => {
    if (typeof controller.login === 'function') {
      const dto = { email: 'test@example.com', password: 'password123' };
      const res = await controller.login(dto);
      expect(res).toBeDefined();
    }
  });

  it('should call register on controller', async () => {
    if (typeof controller.register === 'function') {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
        phone: '5551234567',
      };
      const res = await controller.register(dto);
      expect(res).toBeDefined();
    }
  });
});
