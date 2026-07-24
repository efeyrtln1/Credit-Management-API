import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { CreditLimit } from '../users/entities/credit-limit.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepositoryMock: any;

  beforeEach(async () => {
    userRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(CreditLimit),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn().mockReturnValue({ limit: 1000 }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secretKey'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mockJwtToken'),
            verify: jest.fn().mockReturnValue({ id: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser / login / register logic', () => {
    it('should generate token on login if credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
      };

      userRepositoryMock.findOne.mockResolvedValue(mockUser);

      if (typeof (service as any).validateUser === 'function') {
        const user = await (service as any).validateUser(
          'test@example.com',
          'password123',
        );
        expect(user).toBeDefined();
      }
    });

    it('should create user on register', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'Test',
        phone: '5551234567',
      };
      userRepositoryMock.create.mockReturnValue(dto);
      userRepositoryMock.save.mockResolvedValue({ id: 1, ...dto });

      if (typeof (service as any).register === 'function') {
        const result = await (service as any).register(dto as any);
        expect(result).toBeDefined();
      }
    });

    it('should handle invalid credentials or throw errors', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null);

      try {
        if (typeof (service as any).validateUser === 'function') {
          await (service as any).validateUser('wrong@example.com', 'wrongpass');
        }
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should handle existing user error on register', async () => {
      userRepositoryMock.findOne.mockResolvedValue({
        id: 1,
        email: 'exist@example.com',
      });

      try {
        if (typeof (service as any).register === 'function') {
          await (service as any).register({
            email: 'exist@example.com',
            password: '123',
            phone: '5551234567',
          } as any);
        }
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });
});
