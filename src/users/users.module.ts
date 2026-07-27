import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // 1. Eklendi
import { User } from './entities/user.entity';
import { CreditLimit } from './entities/credit-limit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CreditLimit])],
  controllers: [UsersController], // 2. Eklendi
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
