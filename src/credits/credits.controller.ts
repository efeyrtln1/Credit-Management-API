import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';
import { ApplyCreditDto } from './dto/apply-credit.dto';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('Credits')
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  // 1. PUBLIC: Borç Hesaplayıcı (Auth gerektirmez)
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

  // 2. AUTHENTICATED: Kredi Başvurusu
  @Post('apply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Yeni bir kredi başvurusunda bulunur' })
  @ApiResponse({
    status: 201,
    description: 'Kredi onaylandı ve ödeme planı oluşturuldu.',
  })
  async applyForCredit(
    @Request() req: RequestWithUser,
    @Body() applyCreditDto: ApplyCreditDto,
  ) {
    return this.creditsService.applyForCredit(req.user.userId, applyCreditDto);
  }

  // 3. AUTHENTICATED: Kullanıcının Çektiği Tüm Krediler
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Kullanıcının çektiği kredileri ve taksit planlarını getirir',
  })
  async getMyCredits(@Request() req: RequestWithUser) {
    return this.creditsService.getMyCredits(req.user.userId);
  }

  // 4. AUTHENTICATED: Tek Bir Kredinin Detayı
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Belirtilen kredinin detayını getirir' })
  @ApiParam({ name: 'id', description: 'Kredi ID' })
  async getCreditById(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.creditsService.getCreditById(req.user.userId, id);
  }

  // 5. AUTHENTICATED: Kredinin Taksit Planları (Canlı Gecikme Faizleriyle)
  @Get(':id/payment-plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Krediye ait taksit planlarını ve varsa canlı gecikme faizlerini getirir',
  })
  @ApiParam({ name: 'id', description: 'Kredi ID' })
  async getPaymentPlans(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.creditsService.getPaymentPlansByCreditId(req.user.userId, id);
  }
}
