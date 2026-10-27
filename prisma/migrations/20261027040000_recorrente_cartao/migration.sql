-- CreateTable
CREATE TABLE "RecorrenteCartao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecorrenteCartao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecorrenteCartao_ordem_idx" ON "RecorrenteCartao"("ordem");
