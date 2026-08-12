import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784878122091 implements MigrationInterface {
  name = 'InitialMigration1784878122091';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."credit_limits_scoregroup_enum" AS ENUM('A', 'B', 'C', 'D')`,
    );
    await queryRunner.query(
      `CREATE TABLE "credit_limits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "scoreGroup" "public"."credit_limits_scoregroup_enum" NOT NULL, "baseLimit" numeric(12,2) NOT NULL, "usedAmount" numeric(12,2) NOT NULL DEFAULT '0', "availableLimit" numeric(12,2) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "REL_14b2e856ea882295fe6fd1933d" UNIQUE ("userId"), CONSTRAINT "PK_a107c5b94453801aed5f2074e2d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'SUSPENDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "phone" character varying NOT NULL, "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_type_enum" AS ENUM('FULL', 'SNOOZE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "paymentPlanId" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "type" "public"."payments_type_enum" NOT NULL, "idempotencyKey" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_743b9fb1d2a059f2f7860418e4e" UNIQUE ("idempotencyKey"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_plans_status_enum" AS ENUM('UNPAID', 'PAID', 'LATE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "creditId" uuid NOT NULL, "installmentNo" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "dueDate" date NOT NULL, "status" "public"."payment_plans_status_enum" NOT NULL DEFAULT 'UNPAID', "lateFeeRate" numeric(5,4) NOT NULL, "snoozeCount" integer NOT NULL DEFAULT '0', "paidAt" TIMESTAMP, CONSTRAINT "PK_8f05aee900e96c2e0c24df48262" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."credits_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "credits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "termCount" integer NOT NULL, "interestRate" numeric(5,4) NOT NULL, "totalPayable" numeric(12,2) NOT NULL, "status" "public"."credits_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_45cea097fd0ee625d2e840ed99c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('CREDIT_APPROVED', 'PAYMENT_SUCCESS', 'REMINDER', 'OVERDUE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "payload" jsonb NOT NULL, "sentAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_limits" ADD CONSTRAINT "FK_14b2e856ea882295fe6fd1933dc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_c9bbe88f501706d8193aaf05c5c" FOREIGN KEY ("paymentPlanId") REFERENCES "payment_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_plans" ADD CONSTRAINT "FK_3f08464c00c1728a2110ef848d6" FOREIGN KEY ("creditId") REFERENCES "credits"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credits" ADD CONSTRAINT "FK_564c4ffe9a4dea0c7d003fe42ff" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credits" DROP CONSTRAINT "FK_564c4ffe9a4dea0c7d003fe42ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_plans" DROP CONSTRAINT "FK_3f08464c00c1728a2110ef848d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_c9bbe88f501706d8193aaf05c5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_limits" DROP CONSTRAINT "FK_14b2e856ea882295fe6fd1933dc"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE "credits"`);
    await queryRunner.query(`DROP TYPE "public"."credits_status_enum"`);
    await queryRunner.query(`DROP TABLE "payment_plans"`);
    await queryRunner.query(`DROP TYPE "public"."payment_plans_status_enum"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payments_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TABLE "credit_limits"`);
    await queryRunner.query(
      `DROP TYPE "public"."credit_limits_scoregroup_enum"`,
    );
  }
}
