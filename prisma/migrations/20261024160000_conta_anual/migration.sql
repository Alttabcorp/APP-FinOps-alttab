-- CreateEnum
CREATE TYPE "LadoContaAnual" AS ENUM ('CASA', 'EMPRESA');

-- AlterEnum
ALTER TYPE "TipoItem" ADD VALUE 'ANUAL';

-- CreateTable
CREATE TABLE "ContaAnual" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "mes" INTEGER NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "valorParcela" DECIMAL(12,2) NOT NULL,
    "lado" "LadoContaAnual" NOT NULL DEFAULT 'CASA',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaAnual_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ItemFinanceiro" ADD COLUMN "contaAnualId" TEXT;

-- CreateIndex
CREATE INDEX "ContaAnual_mes_idx" ON "ContaAnual"("mes");

-- CreateIndex
CREATE INDEX "ContaAnual_ordem_idx" ON "ContaAnual"("ordem");

-- CreateIndex
CREATE INDEX "ItemFinanceiro_contaAnualId_idx" ON "ItemFinanceiro"("contaAnualId");

-- AddForeignKey
ALTER TABLE "ItemFinanceiro" ADD CONSTRAINT "ItemFinanceiro_contaAnualId_fkey" FOREIGN KEY ("contaAnualId") REFERENCES "ContaAnual"("id") ON DELETE CASCADE ON UPDATE CASCADE;
