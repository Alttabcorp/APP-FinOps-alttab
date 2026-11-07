ALTER TABLE "MesFinanceiro" ADD COLUMN "sobraAnteriorConfirmada" BOOLEAN NOT NULL DEFAULT false;
-- Meses anteriores ao atual já foram tratados; só pergunta a partir de 2026-11.
UPDATE "MesFinanceiro" SET "sobraAnteriorConfirmada" = true WHERE "competencia" < '2026-11';
