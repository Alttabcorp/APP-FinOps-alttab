import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";

export const TIPOS_TRANSACAO = ["DEPOSITO", "ENTRADA", "RETIRADA", "REPOSICAO", "AJUSTE", "ESTORNO"] as const;
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number];

export const ROTULOS_TRANSACAO: Record<TipoTransacao, string> = {
  DEPOSITO: "Depósito",
  ENTRADA: "Entrada extra",
  RETIRADA: "Retirada",
  REPOSICAO: "Reposição",
  AJUSTE: "Ajuste de saldo",
  ESTORNO: "Estorno",
};

export type TransacaoDTO = {
  id: string;
  data: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  competencia: string;
  contaId: string;
  contaNome: string;
};

type Cliente = Prisma.TransactionClient | typeof prisma;

/** Anota uma movimentação de saldo. `valor` com sinal: positivo entra, negativo sai. */
export const registrarTransacao = async (
  cliente: Cliente,
  dados: { contaId: string; tipo: TipoTransacao; descricao: string; valor: number; competencia?: string },
) => {
  const valor = Math.round(dados.valor * 100) / 100;
  if (Math.abs(valor) < 0.005) return;
  await cliente.transacao.create({
    data: {
      contaId: dados.contaId,
      tipo: dados.tipo,
      descricao: dados.descricao.slice(0, 160),
      valor,
      competencia: dados.competencia ?? competenciaAtual(),
    },
  });
};

export const listarTransacoes = async (filtro: { contaId?: string; competencia?: string } = {}) => {
  const linhas = await prisma.transacao.findMany({
    where: {
      ...(filtro.contaId ? { contaId: filtro.contaId } : {}),
      ...(filtro.competencia ? { competencia: filtro.competencia } : {}),
    },
    include: { conta: { select: { nome: true } } },
    orderBy: [{ data: "desc" }, { id: "desc" }],
    take: 500,
  });
  return linhas.map(
    (linha): TransacaoDTO => ({
      id: linha.id,
      data: linha.data.toISOString(),
      tipo: linha.tipo as TipoTransacao,
      descricao: linha.descricao,
      valor: Number(linha.valor),
      competencia: linha.competencia,
      contaId: linha.contaId,
      contaNome: linha.conta.nome,
    }),
  );
};

export const competenciasComTransacao = async () => {
  const linhas = await prisma.transacao.findMany({
    distinct: ["competencia"],
    select: { competencia: true },
    orderBy: { competencia: "desc" },
  });
  return linhas.map((linha) => linha.competencia);
};

export type EntradaPayload = { contaId: string; valor: number; descricao: string; competencia?: string };

/** Entrada avulsa numa caixinha (ex.: venda da empresa). Soma no saldo e entra no histórico. */
export const registrarEntrada = async (payload: EntradaPayload) => {
  const valor = Math.round(Number(payload.valor) * 100) / 100;
  if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe o valor da entrada.");
  const descricao = String(payload.descricao ?? "").trim();
  if (!descricao) throw new Error("Informe de onde veio o dinheiro.");
  if (descricao.length > 80) throw new Error("A descrição é longa demais.");

  return prisma.$transaction(async (tx) => {
    const conta = await tx.contaBancaria.findUnique({ where: { id: payload.contaId } });
    if (!conta) throw new Error("Caixinha não encontrada.");
    const saldo = Math.round((Number(conta.saldo) + valor) * 100) / 100;
    await tx.contaBancaria.update({ where: { id: conta.id }, data: { saldo } });
    await registrarTransacao(tx, {
      contaId: conta.id,
      tipo: "ENTRADA",
      descricao,
      valor,
      competencia: payload.competencia,
    });
    return { saldo, contaNome: conta.nome };
  });
};
