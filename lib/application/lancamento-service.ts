import { prisma } from "@/lib/db/prisma";
import { obterOuCriarMes } from "@/lib/application/mes-service";
import {
  competenciaDaFatura,
  DIA_FECHAMENTO_PADRAO,
  DIA_PAGAMENTO_PADRAO,
  hojeSaoPaulo,
  isDiaFechamento,
  isDiaPagamento,
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

export const ROTULOS_CATEGORIA_VARIAVEL: Record<CategoriaVariavel, string> = {
  feira: "Feira",
  gasolina: "Gasolina",
  cartao: "Cartão avulso",
};

/** Como a feira/gasolina foi paga (cartão de crédito vs dinheiro vs vale). */
export const MEIOS_PAGAMENTO_VARIAVEL = ["dinheiro", "vale", "cartao"] as const;
export type MeioPagamentoVariavel = (typeof MEIOS_PAGAMENTO_VARIAVEL)[number];

export const ROTULOS_MEIO_PAGAMENTO: Record<MeioPagamentoVariavel, string> = {
  dinheiro: "Dinheiro",
  vale: "Vale",
  cartao: "Cartão",
};

export type TemaVariavel = "feira" | "gasolina";

const arredondar = (valor: number) => Math.round(valor * 100) / 100;

const temPrefixo = (descricao: string, rotulo: string) =>
  descricao === rotulo || descricao.startsWith(`${rotulo} ·`);

/** Monta a descrição com prefixo do meio/tema (ex.: "Vale · Mercado"). */
export const descricaoComPrefixo = (prefixo: string, detalhe?: string) =>
  [prefixo, String(detalhe ?? "").trim()].filter(Boolean).join(" · ").slice(0, 80);

/** Dia civil (AAAA-MM-DD) no fuso de São Paulo. */
export const chaveDiaSaoPaulo = (isoOuData: string | Date) => {
  const partes = hojeSaoPaulo(typeof isoOuData === "string" ? new Date(isoOuData) : isoOuData);
  return `${partes.ano}-${String(partes.mes).padStart(2, "0")}-${String(partes.dia).padStart(2, "0")}`;
};

/** Competência AAAA-MM a partir da data civil em São Paulo. */
export const competenciaDaDataSaoPaulo = (isoOuData: string | Date) =>
  chaveDiaSaoPaulo(isoOuData).slice(0, 7);

export const somarLancamentos = (itens: LancamentoDTO[]) =>
  arredondar(itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0));

/** Quantas vezes e quanto foi lançado no dia de hoje (fuso SP). */
export const resumoLancamentosHoje = (itens: LancamentoDTO[], agora = new Date()) => {
  const chaveHoje = chaveDiaSaoPaulo(agora);
  const doDia = itens.filter((item) => chaveDiaSaoPaulo(item.data) === chaveHoje);
  return { vezes: doDia.length, total: somarLancamentos(doDia), itens: doDia };
};

/** Detecta o meio de pagamento a partir da categoria e do prefixo na descrição. */
export const meioPagamentoLancamento = (item: LancamentoDTO): MeioPagamentoVariavel => {
  if (item.categoria === "cartao") return "cartao";
  if (temPrefixo(item.descricao, "Vale")) return "vale";
  return "dinheiro";
};

/** Feira/gasolina no dinheiro/vale, ou no cartão com prefixo "Feira ·" / "Gasolina ·". */
export const ehLancamentoDoTema = (item: LancamentoDTO, tema: TemaVariavel) => {
  if (item.categoria === tema) return true;
  if (item.categoria === "cartao") {
    const rotulo = ROTULOS_CATEGORIA_VARIAVEL[tema];
    return temPrefixo(item.descricao, rotulo);
  }
  return false;
};

/**
 * Tudo de feira (ou gasolina) no mês civil — dinheiro, vale e cartão —
 * para responder “quanto gastei de mercado/gasolina neste mês”.
 */
export const resumoTemaNoMes = (
  itens: LancamentoDTO[],
  tema: TemaVariavel,
  competencia: string,
) => {
  const lista = itens
    .filter(
      (item) =>
        ehLancamentoDoTema(item, tema) && competenciaDaDataSaoPaulo(item.data) === competencia,
    )
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));

  const porMeio: Record<MeioPagamentoVariavel, number> = { dinheiro: 0, vale: 0, cartao: 0 };
  for (const item of lista) {
    porMeio[meioPagamentoLancamento(item)] += Number(item.valor) || 0;
  }

  return {
    itens: lista,
    total: somarLancamentos(lista),
    porMeio: {
      dinheiro: arredondar(porMeio.dinheiro),
      vale: arredondar(porMeio.vale),
      cartao: arredondar(porMeio.cartao),
    },
  };
};

/** Texto curto do detalhe, sem o prefixo Feira/Gasolina/Vale. */
export const detalheDescricaoLancamento = (item: LancamentoDTO) => {
  const partes = item.descricao.split(" · ").map((p) => p.trim()).filter(Boolean);
  const prefixos = new Set(["Feira", "Gasolina", "Vale", "Cartão avulso"]);
  const resto = partes.filter((p) => !prefixos.has(p));
  return resto.join(" · ");
};

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

export const obterDiaPagamentoCartao = async () => {
  const preferencia = await prisma.preferenciaCasa.findUnique({ where: { id: "casa" } });
  return preferencia?.diaPagamentoCartao ?? DIA_PAGAMENTO_PADRAO;
};

export const salvarDiaPagamentoCartao = async (dia: number) => {
  if (!isDiaPagamento(dia)) throw new Error("Informe um dia de 1 a 28.");
  await prisma.preferenciaCasa.upsert({
    where: { id: "casa" },
    create: { id: "casa", diaPagamentoCartao: dia, atualizadoEm: new Date() },
    update: { diaPagamentoCartao: dia },
  });
};

/** Fatura em que uma compra feita hoje entra, respeitando o dia de fechamento. */
export const competenciaDaFaturaHoje = async () =>
  competenciaDaFatura(hojeSaoPaulo(), await obterDiaFechamentoCartao());

const mapearLancamento = (linha: {
  id: string;
  competencia: string;
  categoria: string;
  valor: { toString(): string } | number;
  descricao: string;
  data: Date;
}): LancamentoDTO | null => {
  if (!isCategoriaVariavel(linha.categoria)) return null;
  return {
    id: linha.id,
    competencia: linha.competencia,
    categoria: linha.categoria,
    valor: Number(linha.valor),
    descricao: linha.descricao,
    data: linha.data.toISOString(),
  };
};

export const listarLancamentos = async (competencias: string[]): Promise<LancamentoDTO[]> => {
  if (competencias.length === 0) return [];
  const linhas = await prisma.lancamentoVariavel.findMany({
    where: { competencia: { in: competencias } },
    orderBy: [{ data: "desc" }, { id: "desc" }],
  });
  return linhas.map(mapearLancamento).filter((linha): linha is LancamentoDTO => linha != null);
};

/** Lista lançamentos para o histórico (filtro opcional por mês). */
export const listarLancamentosHistorico = async (competencia?: string): Promise<LancamentoDTO[]> => {
  const linhas = await prisma.lancamentoVariavel.findMany({
    where: competencia ? { competencia } : undefined,
    orderBy: [{ data: "desc" }, { id: "desc" }],
    take: competencia ? undefined : 200,
  });
  return linhas.map(mapearLancamento).filter((linha): linha is LancamentoDTO => linha != null);
};

export const competenciasComLancamento = async () => {
  const linhas = await prisma.lancamentoVariavel.findMany({
    distinct: ["competencia"],
    select: { competencia: true },
    orderBy: { competencia: "desc" },
  });
  return linhas.map((linha) => linha.competencia).filter(isCompetencia);
};

/** Soma um gasto ao total da categoria no mês (ex.: mais uma ida ao mercado). */
export const adicionarLancamento = async (payload: {
  competencia: string;
  categoria: CategoriaVariavel;
  valor: number;
  descricao?: string;
  /** Em cartão: grava nesta fatura (senão usa a fatura aberta de hoje). */
  competenciaFatura?: string;
}): Promise<{ competencia: string }> => {
  if (!isCompetencia(payload.competencia)) throw new Error("Mês inválido.");
  // Cartão: por padrão a fatura segue a data de hoje; dá para forçar o mês (ex.: compra 1x).
  const competencia =
    payload.categoria === "cartao"
      ? payload.competenciaFatura && isCompetencia(payload.competenciaFatura)
        ? payload.competenciaFatura
        : await competenciaDaFaturaHoje()
      : payload.competencia;
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
