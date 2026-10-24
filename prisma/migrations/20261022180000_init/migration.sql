-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('SALDO', 'EXTRA', 'CONTA', 'EXTRA_MES');

-- CreateEnum
CREATE TYPE "PapelExtra" AS ENUM ('VALE_TRANSPORTE', 'VALE_ALIMENTACAO', 'PROVENTO_FUNDO', 'OUTRO');

-- CreateTable
CREATE TABLE "MesFinanceiro" (
    "id" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "feiraReal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cartaoReal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gasolinaReal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fundoReal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "alttabReal" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "poupancaReal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "poupancaEditado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MesFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemFinanceiro" (
    "id" TEXT NOT NULL,
    "mesId" TEXT NOT NULL,
    "tipo" "TipoItem" NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "papel" "PapelExtra",
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ItemFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MesFinanceiro_competencia_key" ON "MesFinanceiro"("competencia");

-- CreateIndex
CREATE INDEX "ItemFinanceiro_mesId_tipo_idx" ON "ItemFinanceiro"("mesId", "tipo");

-- AddForeignKey
ALTER TABLE "ItemFinanceiro" ADD CONSTRAINT "ItemFinanceiro_mesId_fkey" FOREIGN KEY ("mesId") REFERENCES "MesFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
