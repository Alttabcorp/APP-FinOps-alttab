import { indiceEntreCompetencias, isCompetencia } from "./competencia";

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
