-- CreateTable
CREATE TABLE "LancamentoVariavel" (
    "id" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LancamentoVariavel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LancamentoVariavel_competencia_categoria_idx" ON "LancamentoVariavel"("competencia", "categoria");
