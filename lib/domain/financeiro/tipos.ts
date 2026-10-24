import type { EtapaPrioridade } from "./prioridade";
import type { DestinoRendimento } from "./rendimento";

export const PAPEIS_EXTRA = [
  "VALE_TRANSPORTE",
  "VALE_ALIMENTACAO",
  "PROVENTO_FUNDO",
  "PROVENTO_POUPANCA",
  "OUTRO",
] as const;

export type PapelExtra = (typeof PAPEIS_EXTRA)[number];

export const TIPOS_ITEM = ["SALDO", "EXTRA", "CONTA", "EXTRA_MES", "ANUAL"] as const;

export type TipoItem = (typeof TIPOS_ITEM)[number];

export type ItemFinanceiro = {
  nome: string;
  valor: number;
  papel?: PapelExtra | null;
};

export type EntradaMes = {
  saldo: ItemFinanceiro[];
  extra: ItemFinanceiro[];
  contas: ItemFinanceiro[];
  extraMes: ItemFinanceiro[];
  anuais?: ItemFinanceiro[];
  despesasVariaveis: {
    feira: number;
    cartao: number;
    gasolina: number;
  };
  investimentos: {
    fundo: number;
    alttab: number;
    poupanca: number;
    poupancaEditado: boolean;
  };
  gastoPessoalAlvo?: number | null;
  reposicaoMeta?: number;
};

export type ParSugestaoReal = {
  sugestao: number;
  real: number;
  variacao: number;
};

export type ResultadoMes = {
  totalSaldo: number;
  totalExtra: number;
  ganhoMes: number;
  valeTransporte: number;
  valeAlimentacao: number;
  proventoFundo: number;
  proventoPoupanca: number;
  rendimento: DestinoRendimento;
  totalContas: number;
  totalExtraMes: number;
  totalAnual: number;
  gastoMensal: number;
  saldoContas: number;
  despesasVariaveis: {
    feira: ParSugestaoReal;
    cartao: ParSugestaoReal;
    gasolina: ParSugestaoReal;
  };
  investimentos: {
    fundo: ParSugestaoReal & { base: number; ajuste: number };
    alttab: ParSugestaoReal;
    poupanca: ParSugestaoReal;
    totalInvestido: number;
  };
  resumo: {
    ganhou: number;
    gasto: number;
    sobrou: number;
  };
  distribuicao: {
    metaFinal: number;
    gastoPessoal: number;
    reposicaoMeta: number;
  };
  prioridade: EtapaPrioridade[];
};

export const ALTTAB_SUGESTAO = 100;
