-- AlterTable
ALTER TABLE "MesFinanceiro" ADD COLUMN "fechado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MesFinanceiro" ADD COLUMN "fechadoEm" TIMESTAMP(3);
