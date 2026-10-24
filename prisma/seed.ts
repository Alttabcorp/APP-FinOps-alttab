import { PrismaClient } from "@prisma/client";
import { competenciaAtual } from "../lib/domain/financeiro/competencia";
import { contasPadrao } from "../lib/domain/financeiro/conta";
import { itensPadrao } from "../lib/domain/financeiro/padroes";
import { rendasPadrao } from "../lib/domain/financeiro/renda";

const prisma = new PrismaClient();

async function main() {
  if ((await prisma.contaBancaria.count()) === 0) {
    await prisma.contaBancaria.createMany({
      data: contasPadrao().map((conta) => ({
        nome: conta.nome,
        finalidade: conta.finalidade,
        saldo: conta.saldo,
        meta: conta.meta,
        metaMensal: conta.metaMensal,
        ordem: conta.ordem ?? 0,
        atualizadoEm: new Date(),
      })),
    });
  }

  if ((await prisma.fonteRenda.count()) === 0) {
    await prisma.fonteRenda.createMany({
      data: rendasPadrao().map((renda) => ({
        nome: renda.nome,
        tipo: renda.tipo,
        titular: renda.titular,
        ordem: renda.ordem ?? 0,
        atualizadoEm: new Date(),
      })),
    });
  }

  const competencia = competenciaAtual();
  const existente = await prisma.mesFinanceiro.findUnique({ where: { competencia } });
  if (existente) return;

  await prisma.mesFinanceiro.create({
    data: {
      competencia,
      alttabReal: 100,
      itens: {
        create: itensPadrao().map((item, ordem) => ({
          tipo: item.tipo,
          nome: item.nome,
          valor: item.valor,
          papel: item.papel ?? null,
          ordem,
        })),
      },
    },
  });
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
