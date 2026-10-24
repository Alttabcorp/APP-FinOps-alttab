ALTER TYPE "FinalidadeConta" ADD VALUE 'RESERVA';

ALTER TABLE "ContaBancaria" ADD COLUMN "metaMensal" DECIMAL(12,2);
