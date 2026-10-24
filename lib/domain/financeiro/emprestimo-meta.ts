import { valorDaParcela } from "./cartao";
import { indiceEntreCompetencias, isCompetencia } from "./competencia";
import { calcularProgressoMeta, type ProgressoMeta } from "./conta";

export type EmprestimoMetaEntrada = {
  nome: string;
  valorTotal: number;
  parcelas: number;
  competenciaInicio: string;
  pagoTotal?: number;
};

export type SituacaoEmprestimoMeta = {
  aberto: number;
  pago: number;
  quitado: boolean;
  parcelaSugerida: number;
  parcelasRestantes: number;
};

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

const numero = (valor: number | null | undefined) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export const abertoEmprestimoMeta = (emprestimo: Pick<EmprestimoMetaEntrada, "valorTotal" | "pagoTotal">) =>
  round2(Math.max(0, numero(emprestimo.valorTotal) - numero(emprestimo.pagoTotal)));

export const sacarDaMeta = (saldo: number, valor: number) => {
  const atual = round2(Math.max(0, numero(saldo)));
  const saque = round2(numero(valor));
  if (saque <= 0) throw new Error("Informe o valor da compra.");
  if (saque > atual + 0.005) throw new Error("A meta não tem saldo para essa compra à vista.");
  return { saldo: round2(atual - saque), saque };
};

export const devolverParaMeta = (saldo: number, aberto: number, valor: number) => {
  const atual = round2(Math.max(0, numero(saldo)));
  const deve = round2(Math.max(0, numero(aberto)));
  const informado = round2(numero(valor));
  if (informado <= 0) throw new Error("Informe quanto vai devolver.");
  if (deve < 0.005) throw new Error("Essa compra já voltou para a meta.");
  if (informado > deve + 0.005) throw new Error("Não deve tanto assim para a meta.");
  const pago = round2(Math.min(informado, deve));
  return { saldo: round2(atual + pago), pago, aberto: round2(deve - pago) };
};

export const parcelaDevolucao = (emprestimo: EmprestimoMetaEntrada, competencia: string) => {
  const aberto = abertoEmprestimoMeta(emprestimo);
  if (aberto < 0.005) return 0;
  if (!isCompetencia(emprestimo.competenciaInicio) || !isCompetencia(competencia)) return 0;
  const n = Math.trunc(emprestimo.parcelas);
  if (n <= 0) return 0;
  const indice = indiceEntreCompetencias(emprestimo.competenciaInicio, competencia);
  if (indice < 0) return 0;
  const pago = round2(Math.max(0, numero(emprestimo.pagoTotal)));
  const ate = Math.min(indice + 1, n);
  let esperado = 0;
  for (let i = 0; i < ate; i += 1) {
    esperado = round2(esperado + valorDaParcela(emprestimo.valorTotal, n, i));
  }
  if (pago + 0.005 >= esperado) return 0;
  const parcela = valorDaParcela(emprestimo.valorTotal, n, Math.min(indice, n - 1));
  return round2(Math.min(parcela, round2(esperado - pago), aberto));
};

export const somarDevolucao = (emprestimos: EmprestimoMetaEntrada[], competencia: string) =>
  round2(emprestimos.reduce((acc, emprestimo) => acc + parcelaDevolucao(emprestimo, competencia), 0));

export const situacaoEmprestimoMeta = (
  emprestimo: EmprestimoMetaEntrada,
  competencia: string,
): SituacaoEmprestimoMeta => {
  const pago = round2(Math.max(0, numero(emprestimo.pagoTotal)));
  const aberto = abertoEmprestimoMeta(emprestimo);
  const n = Math.max(1, Math.trunc(emprestimo.parcelas));
  const base = valorDaParcela(emprestimo.valorTotal, n, 0);
  const parcelasRestantes =
    aberto < 0.005 ? 0 : base < 0.005 ? 1 : Math.max(1, Math.ceil(aberto / base - 0.0001));
  return {
    aberto,
    pago,
    quitado: aberto < 0.005,
    parcelaSugerida: parcelaDevolucao(emprestimo, competencia),
    parcelasRestantes,
  };
};

export const progressoDevolucao = (
  emprestimo: Pick<EmprestimoMetaEntrada, "valorTotal" | "pagoTotal">,
): ProgressoMeta => calcularProgressoMeta(numero(emprestimo.pagoTotal), emprestimo.valorTotal);
