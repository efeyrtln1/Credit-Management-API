import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min, Max, IsInt } from 'class-validator';

export class ApplyCreditDto {
  @ApiProperty({
    example: 5000,
    description: 'Çekilmek istenen kredi miktarı',
  })
  @IsNumber({}, { message: 'Miktar bir sayı olmalıdır.' })
  @IsPositive({ message: "Miktar 0'dan büyük olmalıdır." })
  @Min(500, { message: 'Minimum kredi miktarı 500 TL olmalıdır.' })
  amount!: number;

  @ApiProperty({
    example: 6,
    description: 'Vade sayısı (Taksit adedi)',
  })
  @IsInt({ message: 'Vade sayısı tam sayı olmalıdır.' })
  @Min(3, { message: 'Minimum vade 3 ay olabilir.' })
  @Max(36, { message: 'Maksimum vade 36 ay olabilir.' })
  termCount!: number;
}
