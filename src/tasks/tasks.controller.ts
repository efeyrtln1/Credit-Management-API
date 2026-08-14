import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';

@ApiTags('Tasks (Manual Trigger / Test)')
@Controller('tasks-test')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('trigger-late-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gecikme kontrolü cron işini manuel tetikler (00:01 Job)' })
  @ApiResponse({ status: 200, description: 'Late check cron başarıyla çalıştırıldı.' })
  async triggerLateCheck() {
    await this.tasksService.handleLateCheck();
    return { message: 'Late-check job executed successfully' };
  }

  @Post('trigger-reminders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hatırlatma bildirimleri cron işini manuel tetikler (09:00 Job)' })
  @ApiResponse({ status: 200, description: 'Reminder cron başarıyla çalıştırıldı.' })
  async triggerReminders() {
    await this.tasksService.handleReminders();
    return { message: 'Reminder job executed successfully' };
  }
}