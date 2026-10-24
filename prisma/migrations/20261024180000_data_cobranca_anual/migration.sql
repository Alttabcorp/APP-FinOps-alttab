-- AlterTable
ALTER TABLE "ContaAnual" ADD COLUMN "dia" INTEGER NOT NULL DEFAULT 1;

-- mes passa a ser o mês da cobrança (última parcela), não o mês em que as parcelas começam.
UPDATE "ContaAnual"
SET "mes" = (("mes" + "parcelas" - 2) % 12) + 1;
