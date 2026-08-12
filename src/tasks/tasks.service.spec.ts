import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentPlan } from '../credits/entities/payment-plan.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(PaymentPlan),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(3),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should execute handleLateCheck successfully', async () => {
    await expect(service.handleLateCheck()).resolves.not.toThrow();
  });

  it('should execute handleReminders successfully', async () => {
    await expect(service.handleReminders()).resolves.not.toThrow();
  });
});
