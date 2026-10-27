-- AlterTable
ALTER TABLE "ContaBancaria" ADD COLUMN "banco" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ContaBancaria" ADD COLUMN "titular" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ContaBancaria" ADD COLUMN "chavePix" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ContaBancaria" ADD COLUMN "recebePoupanca" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ContaAnual" ADD COLUMN "banco" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ContaAnual" ADD COLUMN "chavePix" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "PreferenciaCasa" ADD COLUMN "destinoCartaoNome" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreferenciaCasa" ADD COLUMN "destinoCartaoChave" TEXT NOT NULL DEFAULT '';
