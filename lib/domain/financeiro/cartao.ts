import { avancarCompetencia, indiceEntreCompetencias, isCompetencia } from "./competencia";

export type CompraCartaoEntrada = {
  nome: string;
  valorTotal: number;
  parcelas: number;
  competenciaInicio: string;
};

export type ParcelaCartao = {
  nome: string;
  atual: number;
  total: number;
  valor: number;
  competencia: string;
};

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

export const valorDaParcela = (valorTotal: number, parcelas: number, indice: number) => {
  const n = Math.trunc(parcelas);
  if (n <= 0 || indice < 0 || indice >= n) return 0;
  const base = round2(valorTotal / n);
  if (indice === n - 1) return round2(valorTotal - base * (n - 1));
  return base;
};

export const parcelaNaCompetencia = (
  compra: CompraCartaoEntrada,
  competencia: string,
): ParcelaCartao | null => {
  if (!isCompetencia(compra.competenciaInicio) || !isCompetencia(competencia)) return null;
  const n = Math.trunc(compra.parcelas);
  if (n <= 0) return null;
  const indice = indiceEntreCompetencias(compra.competenciaInicio, competencia);
  if (indice < 0 || indice >= n) return null;
  return {
    nome: compra.nome,
    atual: indice + 1,
    total: n,
    valor: valorDaParcela(compra.valorTotal, n, indice),
    competencia,
  };
};

export const parcelasDoMes = (compras: CompraCartaoEntrada[], competencia: string) =>
  compras
    .map((compra) => parcelaNaCompetencia(compra, competencia))
    .filter((parcela): parcela is ParcelaCartao => parcela != null);

export const faturaDoMes = (compras: CompraCartaoEntrada[], competencia: string) =>
  round2(parcelasDoMes(compras, competencia).reduce((acc, parcela) => acc + parcela.valor, 0));

export type RecorrenteCartaoEntrada = {
  nome: string;
  valor: number;
};

export const somarRecorrentes = (recorrentes: RecorrenteCartaoEntrada[]) =>
  round2(recorrentes.reduce((acc, item) => acc + round2(Math.max(0, numero(item.valor))), 0));

const numero = (valor: number | null | undefined) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export type PlanoCartao = {
  teto: number;
  fixo: number;
  parcelas: number;
  avulso: number;
  fatura: number;
  disponivel: number;
  cabe: number;
  estoura: boolean;
};

export const planejarCartao = (entrada: {
  saldoContas: number;
  fixo?: number;
  parcelas?: number;
  avulso?: number;
}): PlanoCartao => {
  const teto = round2(Math.max(0, numero(entrada.saldoContas)));
  const fixo = round2(Math.max(0, numero(entrada.fixo)));
  const parcelas = round2(Math.max(0, numero(entrada.parcelas)));
  const avulso = round2(Math.max(0, numero(entrada.avulso)));
  const fatura = round2(fixo + parcelas + avulso);
  const disponivel = round2(Math.max(0, teto - fixo - parcelas));
  const cabe = round2(Math.max(0, teto - fatura));
  return {
    teto,
    fixo,
    parcelas,
    avulso,
    fatura,
    disponivel,
    cabe,
    estoura: fatura > teto + 0.005,
  };
};

export const DIA_FECHAMENTO_PADRAO = 7;

/** Dia em que a fatura vira: compras depois dele só são cobradas no mês seguinte. */
export const isDiaFechamento = (valor: unknown): valor is number => {
  const dia = Number(valor);
  return Number.isInteger(dia) && dia >= 1 && dia <= 28;
};

/** Em qual mês (competência) uma compra feita em ano/mes/dia entra na fatura. */
export const competenciaDaFatura = (
  data: { ano: number; mes: number; dia: number },
  diaFechamento: number = DIA_FECHAMENTO_PADRAO,
): string => {
  const base = `${data.ano}-${String(data.mes).padStart(2, "0")}`;
  return data.dia > diaFechamento ? avancarCompetencia(base, 1) : base;
};

/** Data de hoje no fuso de São Paulo, em partes. */
export const hojeSaoPaulo = (agora = new Date()) => {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);
  const pega = (tipo: string) => Number(partes.find((parte) => parte.type === tipo)?.value);
  return { ano: pega("year"), mes: pega("month"), dia: pega("day") };
};
