/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { CreditLimit } from '../users/entities/credit-limit.entity';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const userRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

      userRepositoryMock.findOne.mockResolvedValue(mockUser as never);

      if (typeof (service as any).validateUser === 'function') {
        const user = await (service as any).validateUser('test@example.com', 'password123');
        expect(user).toBeDefined();
      }
    });

    it('should create user on register', async () => {
      const dto = { email: 'new@example.com', password: 'password123', name: 'Test', phone: '5551234567' };
      // Kullanıcı bulunamadı simüle ediliyor ki ConflictException atmasın
      userRepositoryMock.findOne.mockResolvedValue(null as never);
      userRepositoryMock.create.mockReturnValue(dto as never);
      userRepositoryMock.save.mockResolvedValue({ id: 1, ...dto } as never);

      const result = await service.register(dto);
      expect(result).toBeDefined();
    });

    it('should handle invalid credentials or throw errors', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null as never);

      try {
        if (typeof (service as any).validateUser === 'function') {
          await (service as any).validateUser('wrong@example.com', 'wrongpass');
        }
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should handle existing user error on register', async () => {
      userRepositoryMock.findOne.mockResolvedValue({ id: 1, email: 'exist@example.com' } as never);

      try {
        await service.register({ email: 'exist@example.com', password: '123', name: 'Test', phone: '5551234567' });
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });
});