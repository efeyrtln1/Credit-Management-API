import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

interface RequestWithUser extends Request {
  user?: {
    userId?: string;
    id?: string;
    sub?: string;
  };
}

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private extractUserId(req: RequestWithUser): string {
    const user = req?.user;
    return user?.userId || user?.id || user?.sub || '1';
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kullanıcının bildirim geçmişini getirir' })
  async getNotifications(@Req() req: RequestWithUser) {
    const userId = this.extractUserId(req);
    return this.notificationsService.getUserNotifications(userId);
  }
}
