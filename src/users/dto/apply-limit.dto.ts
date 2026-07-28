import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class ApplyLimitDto {
  @ApiProperty({
    example: 2500,
    description: 'Talep edilen yeni limit miktarı',
  })
  @IsNumber({}, { message: 'Miktar bir sayı olmalıdır.' })
  @IsPositive({ message: "Miktar 0'dan büyük olmalıdır." })
  @Min(100, { message: 'Minimum talep miktarı 100 TL olmalıdır.' })
  requestedAmount!: number;
}
