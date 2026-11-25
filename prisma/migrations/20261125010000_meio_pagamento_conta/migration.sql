-- CreateEnum
CREATE TYPE "MeioPagamentoConta" AS ENUM ('DINHEIRO', 'CARTAO', 'VALE');

-- AlterTable
ALTER TABLE "ItemFinanceiro" ADD COLUMN "meioPagamento" "MeioPagamentoConta";
