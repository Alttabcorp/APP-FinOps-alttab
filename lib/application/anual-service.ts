import { prisma } from "@/lib/db/prisma";
import { contaAnualParaDto, type ContaAnualDTO, type ContaAnualPayload } from "@/lib/application/anual-mapper";
import {
  isDiaDoMes,
  isLadoContaAnual,
  isMesDoAno,
  parcelaAnualNaCompetencia,
  valorParcelaAnual,
} from "@/lib/domain/financeiro/anual";

const LIMITE_NOME = 80;

const validarPayload = (payload: ContaAnualPayload) => {
  const nome = payload.nome.trim();
  if (!nome) throw new Error("Informe o nome da conta anual.");
  if (nome.length > LIMITE_NOME) throw new Error("O nome da conta é longo demais.");
  const valor = Number(payload.valor);
  if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe o valor da conta.");
  if (!isDiaDoMes(payload.dia)) throw new Error("Informe o dia da cobrança.");
  if (!isMesDoAno(payload.mes)) throw new Error("Informe o mês da cobrança.");
  const parcelas = Math.trunc(Number(payload.parcelas));
  if (!Number.isFinite(parcelas) || parcelas < 1 || parcelas > 12) {
    throw new Error("Informe de 1 a 12 parcelas até a cobrança.");
  }
  if (!isLadoContaAnual(payload.lado)) throw new Error("Diga se a conta é da casa ou da empresa.");
  return {
    nome,
    valor,
    dia: payload.dia,
    mes: payload.mes,
    parcelas,
    valorParcela: valorParcelaAnual(valor, parcelas, 0),
    lado: payload.lado,
  };
};

export const listarContasAnuais = async (): Promise<ContaAnualDTO[]> => {
  const contas = await prisma.contaAnual.findMany({
    orderBy: [{ lado: "asc" }, { mes: "asc" }, { ordem: "asc" }],
  });
  return contas.map(contaAnualParaDto);
};

const sincronizarMesesAbertos = async () => {
  const abertos = await prisma.mesFinanceiro.findMany({
    where: { fechado: false },
    select: { id: true },
  });
  for (const mes of abertos) {
    await sincronizarContasAnuaisDoMes(mes.id);
  }
};

export const salvarContaAnual = async (payload: ContaAnualPayload): Promise<ContaAnualDTO> => {
  const dados = validarPayload(payload);
  if (payload.id) {
    const existente = await prisma.contaAnual.findUnique({ where: { id: payload.id } });
    if (!existente) throw new Error("Conta anual não encontrada.");
    const atualizada = await prisma.contaAnual.update({
      where: { id: payload.id },
      data: dados,
    });
    await sincronizarMesesAbertos();
    return contaAnualParaDto(atualizada);
  }
  const ultima = await prisma.contaAnual.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const criada = await prisma.contaAnual.create({
    data: { ...dados, ordem: (ultima?.ordem ?? -1) + 1 },
  });
  await sincronizarMesesAbertos();
  return contaAnualParaDto(criada);
};

export const excluirContaAnual = async (id: string) => {
  const existente = await prisma.contaAnual.findUnique({ where: { id } });
  if (!existente) throw new Error("Conta anual não encontrada.");
  await prisma.contaAnual.delete({ where: { id } });
};

export const sincronizarContasAnuaisDoMes = async (mesId: string) => {
  const mes = await prisma.mesFinanceiro.findUnique({
    where: { id: mesId },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
  if (!mes || mes.fechado) return mes;

  const contas = await listarContasAnuais();
  const noMes = contas
    .map((conta) => ({ conta, parcela: parcelaAnualNaCompetencia(conta, mes.competencia) }))
    .filter((linha): linha is { conta: ContaAnualDTO; parcela: NonNullable<ReturnType<typeof parcelaAnualNaCompetencia>> } =>
      linha.parcela != null,
    );
  const idsNoMes = new Set(noMes.map((linha) => linha.conta.id));

  const anuais = mes.itens.filter((item) => item.tipo === "ANUAL");
  for (const item of anuais) {
    if (!item.contaAnualId || !idsNoMes.has(item.contaAnualId)) {
      await prisma.itemFinanceiro.delete({ where: { id: item.id } });
    }
  }

  const restantes = await prisma.itemFinanceiro.findMany({
    where: { mesId: mes.id },
    orderBy: { ordem: "asc" },
  });

  for (const { conta, parcela } of noMes) {
    const item = restantes.find((linha) => linha.contaAnualId === conta.id);
    if (item) {
      if (item.nome !== parcela.nome || Number(item.valor) !== parcela.valor) {
        await prisma.itemFinanceiro.update({
          where: { id: item.id },
          data: { nome: parcela.nome, valor: parcela.valor, tipo: "ANUAL" },
        });
      }
    } else {
      await prisma.itemFinanceiro.create({
        data: {
          mesId: mes.id,
          tipo: "ANUAL",
          nome: parcela.nome,
          valor: parcela.valor,
          ordem: restantes.length,
          contaAnualId: conta.id,
        },
      });
    }
  }

  return prisma.mesFinanceiro.findUnique({
    where: { id: mes.id },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
};
