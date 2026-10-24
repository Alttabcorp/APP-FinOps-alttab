import { isCompetencia } from "./competencia";

export type GastoEmpresaEntrada = {
  nome: string;
  nota?: string;
  valor: number;
  competencia: string;
};

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

const numero = (valor: number | null | undefined) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export const retirarDaEmpresa = (saldo: number, valor: number) => {
  const atual = round2(Math.max(0, numero(saldo)));
  const gasto = round2(numero(valor));
  if (gasto <= 0) throw new Error("Informe o valor do gasto.");
  if (gasto > atual + 0.005) throw new Error("A empresa não tem saldo para esse gasto.");
  return { saldo: round2(atual - gasto), gasto };
};

export const devolverGastoEmpresa = (saldo: number, valor: number) => {
  const atual = round2(Math.max(0, numero(saldo)));
  const volta = round2(Math.max(0, numero(valor)));
  return { saldo: round2(atual + volta), volta };
};

export const gastosNaCompetencia = (gastos: GastoEmpresaEntrada[], competencia: string) => {
  if (!isCompetencia(competencia)) return [];
  return gastos.filter((gasto) => gasto.competencia === competencia);
};

export const totalGastosEmpresa = (gastos: GastoEmpresaEntrada[]) =>
  round2(gastos.reduce((acc, gasto) => acc + round2(Math.max(0, numero(gasto.valor))), 0));
