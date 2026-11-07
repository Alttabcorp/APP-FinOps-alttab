import { prisma } from "@/lib/db/prisma";
import { obterOuCriarMes } from "@/lib/application/mes-service";
import {
  competenciaDaFatura,
  DIA_FECHAMENTO_PADRAO,
  hojeSaoPaulo,
  isDiaFechamento,
} from "@/lib/domain/financeiro/cartao";
import { isCompetencia } from "@/lib/domain/financeiro/competencia";

export const CATEGORIAS_VARIAVEL = ["feira", "gasolina", "cartao"] as const;
export type CategoriaVariavel = (typeof CATEGORIAS_VARIAVEL)[number];

export const isCategoriaVariavel = (valor: unknown): valor is CategoriaVariavel =>
  typeof valor === "string" && (CATEGORIAS_VARIAVEL as readonly string[]).includes(valor);

const COLUNA = { feira: "feiraReal", gasolina: "gasolinaReal", cartao: "cartaoReal" } as const;

export type LancamentoDTO = {
  id: string;
  competencia: string;
  categoria: CategoriaVariavel;
  valor: number;
  descricao: string;
  data: string;
};

const arredondar = (valor: number) => Math.round(valor * 100) / 100;

const erroFechado = "Este mês está fechado. Reabra para editar.";

export const obterDiaFechamentoCartao = async () => {
  const preferencia = await prisma.preferenciaCasa.findUnique({ where: { id: "casa" } });
  return preferencia?.diaFechamentoCartao ?? DIA_FECHAMENTO_PADRAO;
};

export const salvarDiaFechamentoCartao = async (dia: number) => {
  if (!isDiaFechamento(dia)) throw new Error("Informe um dia de 1 a 28.");
  await prisma.preferenciaCasa.upsert({
    where: { id: "casa" },
    create: { id: "casa", diaFechamentoCartao: dia, atualizadoEm: new Date() },
    update: { diaFechamentoCartao: dia },
  });
};

/** Fatura em que uma compra feita hoje entra, respeitando o dia de fechamento. */
export const competenciaDaFaturaHoje = async () =>
  competenciaDaFatura(hojeSaoPaulo(), await obterDiaFechamentoCartao());

export const listarLancamentos = async (competencias: string[]): Promise<LancamentoDTO[]> => {
  const linhas = await prisma.lancamentoVariavel.findMany({
    where: { competencia: { in: competencias } },
    orderBy: [{ data: "desc" }, { id: "desc" }],
  });
  return linhas
    .filter((linha) => isCategoriaVariavel(linha.categoria))
    .map((linha) => ({
      id: linha.id,
      competencia: linha.competencia,
      categoria: linha.categoria as CategoriaVariavel,
      valor: Number(linha.valor),
      descricao: linha.descricao,
      data: linha.data.toISOString(),
    }));
};

/** Soma um gasto ao total da categoria no mês (ex.: mais uma ida ao mercado). */
export const adicionarLancamento = async (payload: {
  competencia: string;
  categoria: CategoriaVariavel;
  valor: number;
  descricao?: string;
}): Promise<{ competencia: string }> => {
  if (!isCompetencia(payload.competencia)) throw new Error("Mês inválido.");
  // Cartão: a fatura é definida pela data da compra (hoje), não pelo mês que está na tela.
  const competencia =
    payload.categoria === "cartao" ? await competenciaDaFaturaHoje() : payload.competencia;
  await obterOuCriarMes(competencia);
  if (!isCategoriaVariavel(payload.categoria)) throw new Error("Categoria inválida.");
  const valor = arredondar(Number(payload.valor));
  if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe o valor do gasto.");
  const descricao = String(payload.descricao ?? "").trim().slice(0, 80);

  await prisma.$transaction(async (tx) => {
    const mes = await tx.mesFinanceiro.findUnique({ where: { competencia } });
    if (!mes) throw new Error("Mês não encontrado.");
    if (mes.fechado) throw new Error(erroFechado);
    const coluna = COLUNA[payload.categoria];
    await tx.lancamentoVariavel.create({
      data: { competencia, categoria: payload.categoria, valor, descricao },
    });
    await tx.mesFinanceiro.update({
      where: { id: mes.id },
      data: { [coluna]: arredondar(Number(mes[coluna]) + valor) },
    });
  });
  return { competencia };
};

export const removerLancamento = async (id: string) => {
  await prisma.$transaction(async (tx) => {
    const lancamento = await tx.lancamentoVariavel.findUnique({ where: { id } });
    if (!lancamento) throw new Error("Lançamento não encontrado.");
    const mes = await tx.mesFinanceiro.findUnique({ where: { competencia: lancamento.competencia } });
    if (mes?.fechado) throw new Error(erroFechado);
    if (mes && isCategoriaVariavel(lancamento.categoria)) {
      const coluna = COLUNA[lancamento.categoria];
      await tx.mesFinanceiro.update({
        where: { id: mes.id },
        data: { [coluna]: Math.max(0, arredondar(Number(mes[coluna]) - Number(lancamento.valor))) },
      });
    }
    await tx.lancamentoVariavel.delete({ where: { id } });
  });
};
