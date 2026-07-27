import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('Credit Limits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credit-limits')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Giriş yapan kullanıcının kredi limitini getirir' })
  @ApiResponse({
    status: 200,
    description: 'Kredi limit bilgileri döndürüldü.',
  })
  @ApiResponse({
    status: 401,
    description: 'Yetkisiz erişim (Token geçersiz veya yok).',
  })
  async getMyCreditLimit(@Request() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.usersService.getCreditLimitByUserId(userId);
  }

  @Patch('me/use')
  @ApiOperation({ summary: 'Kredi limitinden harcama yapar' })
  @ApiResponse({
    status: 200,
    description: 'Harcama başarılı, yeni limit bilgisi döndü.',
  })
  @ApiResponse({
    status: 400,
    description: 'Yetersiz bakiye veya geçersiz miktar.',
  })
  async useCreditLimit(
    @Request() req: RequestWithUser,
    @Body('amount') amount: number,
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException(
        "Harcama miktarı 0'dan büyük bir sayı olmalıdır.",
      );
    }
    const userId = req.user.userId;
    return this.usersService.useCredit(userId, amount);
  }
}
