import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repoMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    repoMock = {
      create: jest.fn().mockImplementation((dto: Partial<Notification>) => dto),
      save: jest
        .fn()
        .mockImplementation((entity: Partial<Notification>) =>
          Promise.resolve({ id: 'notif-1', ...entity, sentAt: new Date() }),
        ),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a notification', async () => {
    const result = await service.createNotification(
      'user-1',
      NotificationType.CREDIT_APPROVED,
      { amount: 1000 },
    );

    expect(repoMock.create).toHaveBeenCalled();
    expect(repoMock.save).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'notif-1');
  });

  it('should return user notifications', async () => {
    const result = await service.getUserNotifications('user-1');
    expect(repoMock.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { sentAt: 'DESC' },
    });
    expect(result).toEqual([]);
  });
});
