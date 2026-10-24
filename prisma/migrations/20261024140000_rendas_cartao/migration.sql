-- CreateEnum
CREATE TYPE "TipoRenda" AS ENUM ('EMPREGO', 'BICO', 'RENDIMENTO', 'VALE_TRANSPORTE', 'VALE_ALIMENTACAO');

-- CreateEnum
CREATE TYPE "TitularRenda" AS ENUM ('EU', 'CONJUGE');

-- CreateTable
CREATE TABLE "FonteRenda" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoRenda" NOT NULL,
    "titular" "TitularRenda" NOT NULL DEFAULT 'EU',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FonteRenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraCartao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "parcelas" INTEGER NOT NULL,
    "valorParcela" DECIMAL(12,2) NOT NULL,
    "competenciaInicio" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompraCartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenciaCasa" (
    "id" TEXT NOT NULL DEFAULT 'casa',
    "metaRendimentoPassivo" DECIMAL(12,2),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenciaCasa_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ItemFinanceiro" ADD COLUMN "fonteRendaId" TEXT;

-- CreateIndex
CREATE INDEX "FonteRenda_ordem_idx" ON "FonteRenda"("ordem");

-- CreateIndex
CREATE INDEX "CompraCartao_competenciaInicio_idx" ON "CompraCartao"("competenciaInicio");

-- CreateIndex
CREATE INDEX "ItemFinanceiro_fonteRendaId_idx" ON "ItemFinanceiro"("fonteRendaId");

-- AddForeignKey
ALTER TABLE "ItemFinanceiro" ADD CONSTRAINT "ItemFinanceiro_fonteRendaId_fkey" FOREIGN KEY ("fonteRendaId") REFERENCES "FonteRenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
