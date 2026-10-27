import { isCompetencia } from "./competencia";

export const LADOS_CONTA_ANUAL = ["CASA", "EMPRESA"] as const;

export type LadoContaAnual = (typeof LADOS_CONTA_ANUAL)[number];

export const ROTULOS_LADO_ANUAL: Record<LadoContaAnual, string> = {
  CASA: "Casa",
  EMPRESA: "Empresa",
};

export const isLadoContaAnual = (valor: unknown): valor is LadoContaAnual =>
  typeof valor === "string" && (LADOS_CONTA_ANUAL as readonly string[]).includes(valor);

export const isMesDoAno = (valor: unknown): valor is number => {
  const mes = Number(valor);
  return Number.isInteger(mes) && mes >= 1 && mes <= 12;
};

export const isDiaDoMes = (valor: unknown): valor is number => {
  const dia = Number(valor);
  return Number.isInteger(dia) && dia >= 1 && dia <= 31;
};

export type ContaAnualEntrada = {
  nome: string;
  valor: number;
  dia: number;
  mes: number;
  parcelas: number;
  lado: LadoContaAnual;
};

export type ParcelaAnual = {
  nome: string;
  atual: number;
  total: number;
  valor: number;
  competencia: string;
  lado: LadoContaAnual;
  dia: number;
};

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

const moduloMes = (valor: number) => ((valor % 12) + 12) % 12;

export const valorParcelaAnual = (valorTotal: number, parcelas: number, indice: number) => {
  const n = Math.trunc(parcelas);
  if (n <= 0 || indice < 0 || indice >= n) return 0;
  const base = round2(valorTotal / n);
  if (indice === n - 1) return round2(valorTotal - base * (n - 1));
  return base;
};

export const mesInicioParcelaAnual = (mesCobranca: number, parcelas: number) => {
  const n = Math.trunc(parcelas);
  if (!isMesDoAno(mesCobranca) || n <= 0) return -1;
  return moduloMes(mesCobranca - n) + 1;
};

export const mesesAteCobranca = (competencia: string, mesCobranca: number) => {
  if (!isCompetencia(competencia) || !isMesDoAno(mesCobranca)) return 0;
  const mesAtual = Number(competencia.slice(5));
  return moduloMes(mesCobranca - mesAtual) + 1;
};

export type ReservaAnual = {
  meses: number;
  valorMes: number;
  caiNesteMes: boolean;
};

export const sugerirReservaMensal = (
  valor: number,
  mesCobranca: number,
  competencia: string,
): ReservaAnual => {
  const meses = Math.max(1, mesesAteCobranca(competencia, mesCobranca));
  const total = Number.isFinite(valor) ? Math.max(0, valor) : 0;
  return {
    meses,
    valorMes: valorParcelaAnual(total, meses, 0),
    caiNesteMes: meses === 1,
  };
};

export const indiceParcelaAnual = (mesCobranca: number, parcelas: number, competencia: string) => {
  const inicio = mesInicioParcelaAnual(mesCobranca, parcelas);
  if (inicio < 0 || !isCompetencia(competencia)) return -1;
  const mes = Number(competencia.slice(5));
  return (mes - inicio + 12) % 12;
};

export const parcelaAnualNaCompetencia = (
  conta: ContaAnualEntrada,
  competencia: string,
): ParcelaAnual | null => {
  const n = Math.trunc(conta.parcelas);
  if (n <= 0) return null;
  const indice = indiceParcelaAnual(conta.mes, n, competencia);
  if (indice < 0 || indice >= n) return null;
  const dia = isDiaDoMes(conta.dia) ? conta.dia : 1;
  return {
    nome: n > 1 ? `${conta.nome} ${indice + 1}/${n}` : conta.nome,
    atual: indice + 1,
    total: n,
    valor: valorParcelaAnual(conta.valor, n, indice),
    competencia,
    lado: conta.lado,
    dia,
  };
};

export const contasAnuaisDoMes = (contas: ContaAnualEntrada[], competencia: string) =>
  contas
    .map((conta) => parcelaAnualNaCompetencia(conta, competencia))
    .filter((parcela): parcela is ParcelaAnual => parcela != null);

export const formatarMesCalendario = (mes: number) => {
  if (!isMesDoAno(mes)) return "";
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2026, mes - 1, 1));
};

export const formatarDataCobranca = (dia: number, mes: number) => {
  if (!isDiaDoMes(dia) || !isMesDoAno(mes)) return "";
  return `dia ${dia} de ${formatarMesCalendario(mes)}`;
};

export const formatarPeriodoAnual = (mes: number, parcelas: number, dia = 1) => {
  const n = Math.trunc(parcelas);
  if (!isMesDoAno(mes) || n <= 0) return "";
  const cobranca = formatarDataCobranca(isDiaDoMes(dia) ? dia : 1, mes);
  if (n >= 12) return `Todo mês · cobra ${cobranca}`;
  if (n === 1) return `Cobra todo ${cobranca}`;
  const inicio = mesInicioParcelaAnual(mes, n);
  return `${n}x de ${formatarMesCalendario(inicio)} até ${cobranca}`;
};

export const agruparContasAnuais = <T extends { lado: LadoContaAnual }>(contas: T[]) =>
  LADOS_CONTA_ANUAL.map((lado) => ({
    lado,
    rotulo: ROTULOS_LADO_ANUAL[lado],
    itens: contas.filter((conta) => conta.lado === lado),
  }));
