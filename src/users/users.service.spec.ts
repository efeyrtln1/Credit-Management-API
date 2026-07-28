import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { CreditLimit, ScoreGroup } from './entities/credit-limit.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repositoryMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    repositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(CreditLimit),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCreditLimitByUserId', () => {
    it('should return credit limit if user exists', async () => {
      const mockLimit = { userId: '1', baseLimit: 1000 } as CreditLimit;
      repositoryMock.findOne.mockResolvedValue(mockLimit);

      const result = await service.getCreditLimitByUserId('1');
      expect(result).toEqual(mockLimit);
    });

    it('should throw NotFoundException if credit limit not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      await expect(service.getCreditLimitByUserId('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('useCredit', () => {
    it('should decrease available limit on success', async () => {
      const mockLimit = {
        userId: '1',
        availableLimit: 1000,
        usedAmount: 0,
      } as CreditLimit;
      repositoryMock.findOne.mockResolvedValue(mockLimit);
      repositoryMock.save.mockImplementation((val) => Promise.resolve(val));

      const result = await service.useCredit('1', 200);
      expect(result.availableLimit).toBe(800);
      expect(result.usedAmount).toBe(200);
    });

    it('should throw BadRequestException if available limit is insufficient', async () => {
      const mockLimit = {
        userId: '1',
        availableLimit: 100,
      } as CreditLimit;
      repositoryMock.findOne.mockResolvedValue(mockLimit);

      await expect(service.useCredit('1', 200)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('applyForLimitIncrease', () => {
    it('should reject application if score group is D', async () => {
      const mockLimit = {
        userId: '1',
        scoreGroup: ScoreGroup.D,
        baseLimit: 1000,
      } as CreditLimit;
      repositoryMock.findOne.mockResolvedValue(mockLimit);

      const result = await service.applyForLimitIncrease('1', 500);
      expect(result.status).toBe('REJECTED');
    });

    it('should approve application for non-D score group', async () => {
      const mockLimit = {
        userId: '1',
        scoreGroup: ScoreGroup.A,
        baseLimit: 1000,
        availableLimit: 1000,
      } as CreditLimit;
      repositoryMock.findOne.mockResolvedValue(mockLimit);
      repositoryMock.save.mockImplementation((val) => Promise.resolve(val));

      const result = await service.applyForLimitIncrease('1', 500);
      expect(result.status).toBe('APPROVED');
      expect(mockLimit.baseLimit).toBe(1500);
    });
  });
});