-- CreateTable
CREATE TABLE "GastoEmpresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nota" TEXT NOT NULL DEFAULT '',
    "valor" DECIMAL(12,2) NOT NULL,
    "competencia" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GastoEmpresa_contaId_idx" ON "GastoEmpresa"("contaId");

-- CreateIndex
CREATE INDEX "GastoEmpresa_competencia_idx" ON "GastoEmpresa"("competencia");

-- AddForeignKey
ALTER TABLE "GastoEmpresa" ADD CONSTRAINT "GastoEmpresa_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
