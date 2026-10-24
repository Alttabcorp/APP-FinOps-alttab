-- CreateTable
CREATE TABLE "EmprestimoMeta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "parcelas" INTEGER NOT NULL,
    "valorParcela" DECIMAL(12,2) NOT NULL,
    "competenciaInicio" TEXT NOT NULL,
    "pagoTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "contaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmprestimoMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmprestimoMeta_contaId_idx" ON "EmprestimoMeta"("contaId");

-- CreateIndex
CREATE INDEX "EmprestimoMeta_competenciaInicio_idx" ON "EmprestimoMeta"("competenciaInicio");

-- AddForeignKey
ALTER TABLE "EmprestimoMeta" ADD CONSTRAINT "EmprestimoMeta_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
