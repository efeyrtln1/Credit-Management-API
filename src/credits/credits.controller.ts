import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
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
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Yeni bir kredi başvurusunda bulunur' })
  @ApiResponse({
    status: 201,
    description: 'Kredi onaylandı ve ödeme planı oluşturuldu.',
  })
  @ApiResponse({
    status: 400,
    description: 'Yetersiz limit veya geçersiz vade/miktar.',
  })
  async applyForCredit(
    @Request() req: RequestWithUser,
    @Body() applyCreditDto: ApplyCreditDto,
  ) {
    return this.creditsService.applyForCredit(req.user.userId, applyCreditDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Kullanıcının çektiği kredileri ve taksit planlarını getirir',
  })
  @ApiResponse({
    status: 200,
    description: 'Kredi ve ödeme planı listesi döndü.',
  })
  async getMyCredits(@Request() req: RequestWithUser) {
    return this.creditsService.getMyCredits(req.user.userId);
  }
}
