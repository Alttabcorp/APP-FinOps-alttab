-- AlterTable
ALTER TABLE "MesFinanceiro" ADD COLUMN "fundoEditado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "alttabEditado" BOOLEAN NOT NULL DEFAULT false;

-- Meses fechados mantêm os valores já registrados; os abertos passam a usar o valor dinâmico.
UPDATE "MesFinanceiro" SET "fundoEditado" = true, "alttabEditado" = true WHERE "fechado" = true;
