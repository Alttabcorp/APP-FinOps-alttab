-- AlterTable
ALTER TABLE "MesFinanceiro" ADD COLUMN "poupancaDepositado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MesFinanceiro" ADD COLUMN "fundoDepositado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MesFinanceiro" ADD COLUMN "alttabDepositado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MesFinanceiro" ADD COLUMN "metaDepositado" BOOLEAN NOT NULL DEFAULT false;
