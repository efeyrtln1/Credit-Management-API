import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../common/guards/idempotency.guard';
import { CreditsService } from './credits.service';
import { ApplyCreditDto } from './dto/apply-credit.dto';

interface RequestWithUser extends Request {
  user?: {
    userId?: string;
    id?: string;
    sub?: string;
    email?: string;
  };
}

@ApiTags('Credits')
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  private extractUserId(req: RequestWithUser): string {
    const user = req?.user;
    return user?.userId || user?.id || user?.sub || '1';
  }

  @Get('calculator')
  @ApiOperation({
    summary: 'Kredi ödeme planı ve gecikme faizi hesaplayıcısı',
  })
  @ApiQuery({ name: 'amount', example: 10000, required: true })
  @ApiQuery({ name: 'termCount', example: 6, required: true })
  @ApiQuery({ name: 'scoreGroup', example: 'A', required: false })
  calculateRepayment(
    @Query('amount') amount: string,
    @Query('termCount') termCount: string,
    @Query('scoreGroup') scoreGroup?: string,
  ) {
    return this.creditsService.calculateRepayment(
      Number(amount),
      Number(termCount),
      scoreGroup,
    );
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Kullanıcının çektiği kredileri ve taksit planlarını getirir',
  })
  async getMyCredits(@Req() req: RequestWithUser) {
    const userId = this.extractUserId(req);
    return this.creditsService.getMyCredits(userId);
  }

  @Get('payment-plans/:id/snooze/preview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Taksit erteleme (snooze) önizlemesi ve ücret hesabı',
  })
  @ApiParam({ name: 'id', description: 'Payment Plan (Taksit) ID' })
  @ApiResponse({
    status: 200,
    description: 'Erteleme ücreti ve yeni vade tarihi bilgisi döner.',
  })
  async previewSnooze(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.creditsService.previewSnooze(id, userId);
  }

  @Post('payment-plans/:id/snooze')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Taksiti ertele (Snooze bedeli ödenir ve vade 30 gün uzatılır)',
  })
  @ApiParam({ name: 'id', description: 'Payment Plan (Taksit) ID' })
  @ApiHeader({
    name: 'X-Idempotency-Key',
    description: 'Çift istek önleyici benzersiz anahtar',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Taksit başarıyla ertelendi.',
  })
  async snoozePaymentPlan(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const userId = this.extractUserId(req);
    return this.creditsService.snoozePaymentPlan(id, userId, idempotencyKey);
  }

  @Post('payment-plans/:id/pay')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @ApiOperation({
    summary: 'Belirtilen taksit için Idempotency kilitli ödeme gerçekleştirir',
  })
  @ApiParam({ name: 'id', description: 'Payment Plan (Taksit) ID' })
  @ApiHeader({
    name: 'X-Idempotency-Key',
    description: 'Çift ödemeyi önleyen benzersiz anahtar (Örn: UUID v4)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Taksit ödemesi başarılı.',
  })
  @ApiResponse({
    status: 409,
    description: 'Çift istek engellendi (Idempotency Lock aktif).',
  })
  async payPaymentPlan(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.creditsService.payPaymentPlan(id, userId);
  }

  @Post('apply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Yeni bir kredi başvurusunda bulunur' })
  @ApiResponse({
    status: 201,
    description: 'Kredi onaylandı ve ödeme planı oluşturuldu.',
  })
  async applyForCredit(
    @Req() req: RequestWithUser,
    @Body() applyCreditDto: ApplyCreditDto,
  ) {
    const userId = this.extractUserId(req);
    return this.creditsService.applyForCredit(userId, applyCreditDto);
  }

  @Get(':id/payment-plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Krediye ait taksit planlarını ve varsa canlı gecikme faizlerini getirir',
  })
  @ApiParam({ name: 'id', description: 'Kredi ID' })
  async getPaymentPlans(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.creditsService.getPaymentPlansByCreditId(userId, id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Belirtilen kredinin detayını getirir' })
  @ApiParam({ name: 'id', description: 'Kredi ID' })
  async getCreditById(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.creditsService.getCreditById(userId, id);
  }
}
