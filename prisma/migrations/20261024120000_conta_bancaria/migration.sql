-- CreateEnum
CREATE TYPE "FinalidadeConta" AS ENUM ('INVESTIMENTO', 'POUPANCA', 'META', 'EMPRESA');

-- CreateTable
CREATE TABLE "ContaBancaria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "finalidade" "FinalidadeConta" NOT NULL,
    "saldo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "meta" DECIMAL(12,2),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContaBancaria_ordem_idx" ON "ContaBancaria"("ordem");
