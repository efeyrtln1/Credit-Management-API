import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { User } from './users/entities/user.entity';
import { CreditLimit } from './users/entities/credit-limit.entity';
import { Credit } from './credits/entities/credit.entity';
import { PaymentPlan } from './credits/entities/payment-plan.entity';
import { Payment } from './payments/entities/payment.entity';
import { Notification } from './notifications/entities/notification.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'secretpassword',
  database: process.env.DB_NAME || 'credit_db',
  entities: [User, CreditLimit, Credit, PaymentPlan, Payment, Notification],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
