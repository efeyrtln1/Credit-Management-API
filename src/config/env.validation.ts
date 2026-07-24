import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 3000;

  // Database
  @IsString()
  DB_HOST!: string;

  @IsNumber()
  DB_PORT!: number;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_NAME!: string;

  // Redis
  @IsString()
  REDIS_HOST!: string;

  @IsNumber()
  REDIS_PORT!: number;

  // Auth
  @IsString()
  JWT_SECRET!: string;

  // Business Parameters
  @IsNumber()
  CREDIT_LIMIT_EXPIRY_MONTHS!: number;

  @IsNumber()
  SCORE_GROUP_LIMIT_A!: number;

  @IsNumber()
  SCORE_GROUP_LIMIT_B!: number;

  @IsNumber()
  SCORE_GROUP_LIMIT_C!: number;

  @IsNumber()
  SCORE_GROUP_LIMIT_D!: number;

  @IsNumber()
  MAX_ACTIVE_CREDITS!: number;

  @IsNumber()
  MIN_CREDIT_AMOUNT!: number;

  @IsNumber()
  MAX_TERM_COUNT!: number;

  @IsNumber()
  INSTALLMENT_INTERVAL_DAYS!: number;

  @IsNumber()
  REMINDER_DAYS_BEFORE_DUE!: number;

  @IsNumber()
  SNOOZE_FEE_RATE!: number;

  @IsNumber()
  MAX_SNOOZE_COUNT!: number;

  @IsNumber()
  SNOOZE_EXTENSION_DAYS!: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true, // String olarak gelen sayıları otomatik number'a çevirir
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment Validation Error:\n${errors.toString()}`);
  }
  return validatedConfig;
}
