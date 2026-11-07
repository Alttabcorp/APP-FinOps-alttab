-- CreateTable
CREATE TABLE "Transacao" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "competencia" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,

    CONSTRAINT "Transacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transacao_contaId_idx" ON "Transacao"("contaId");
CREATE INDEX "Transacao_data_idx" ON "Transacao"("data");
CREATE INDEX "Transacao_competencia_idx" ON "Transacao"("competencia");

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBancaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Histórico já existente: retiradas da empresa
INSERT INTO "Transacao" ("id", "data", "tipo", "descricao", "valor", "competencia", "contaId")
SELECT gen_random_uuid()::text, g."criadoEm", 'RETIRADA', g."nome", -g."valor", g."competencia", g."contaId"
FROM "GastoEmpresa" g;

-- Retiradas de meta/reserva/poupança e reposições já feitas
INSERT INTO "Transacao" ("id", "data", "tipo", "descricao", "valor", "competencia", "contaId")
SELECT gen_random_uuid()::text, e."criadoEm", 'RETIRADA', e."nome", -e."valorTotal", e."competenciaInicio", e."contaId"
FROM "EmprestimoMeta" e;

INSERT INTO "Transacao" ("id", "data", "tipo", "descricao", "valor", "competencia", "contaId")
SELECT gen_random_uuid()::text, e."atualizadoEm", 'REPOSICAO', 'Reposição: ' || e."nome", e."pagoTotal", e."competenciaInicio", e."contaId"
FROM "EmprestimoMeta" e WHERE e."pagoTotal" > 0;

-- Depósitos já creditados nas caixinhas
INSERT INTO "Transacao" ("id", "data", "tipo", "descricao", "valor", "competencia", "contaId")
SELECT gen_random_uuid()::text, m."atualizadoEm", 'DEPOSITO', 'Depósito: Alttab', m."alttabCreditado", m."competencia",
  (SELECT c."id" FROM "ContaBancaria" c WHERE c."finalidade" = 'EMPRESA' ORDER BY c."ordem", c."criadoEm" LIMIT 1)
FROM "MesFinanceiro" m WHERE m."alttabCreditado" > 0
  AND EXISTS (SELECT 1 FROM "ContaBancaria" c WHERE c."finalidade" = 'EMPRESA');

INSERT INTO "Transacao" ("id", "data", "tipo", "descricao", "valor", "competencia", "contaId")
SELECT gen_random_uuid()::text, m."atualizadoEm", 'DEPOSITO', 'Depósito: fundo imobiliário', m."fundoCreditado", m."competencia",
  (SELECT c."id" FROM "ContaBancaria" c WHERE c."finalidade" = 'INVESTIMENTO' ORDER BY c."ordem", c."criadoEm" LIMIT 1)
FROM "MesFinanceiro" m WHERE m."fundoCreditado" > 0
  AND EXISTS (SELECT 1 FROM "ContaBancaria" c WHERE c."finalidade" = 'INVESTIMENTO');

INSERT INTO "Transacao" ("id", "data", "tipo", "descricao", "valor", "competencia", "contaId")
SELECT gen_random_uuid()::text, m."atualizadoEm", 'DEPOSITO', 'Depósito: objetivo', m."metaCreditado", m."competencia",
  (SELECT c."id" FROM "ContaBancaria" c WHERE c."finalidade" = 'META' ORDER BY c."ordem", c."criadoEm" LIMIT 1)
FROM "MesFinanceiro" m WHERE m."metaCreditado" > 0
  AND EXISTS (SELECT 1 FROM "ContaBancaria" c WHERE c."finalidade" = 'META');

INSERT INTO "Transacao" ("id", "data", "tipo", "descricao", "valor", "competencia", "contaId")
SELECT gen_random_uuid()::text, m."atualizadoEm", 'DEPOSITO', 'Depósito: poupança', m."poupancaCreditado", m."competencia",
  (SELECT c."id" FROM "ContaBancaria" c WHERE c."finalidade" = 'POUPANCA' OR c."recebePoupanca" ORDER BY c."recebePoupanca" DESC, c."ordem", c."criadoEm" LIMIT 1)
FROM "MesFinanceiro" m WHERE m."poupancaCreditado" > 0
  AND EXISTS (SELECT 1 FROM "ContaBancaria" c WHERE c."finalidade" = 'POUPANCA' OR c."recebePoupanca");
