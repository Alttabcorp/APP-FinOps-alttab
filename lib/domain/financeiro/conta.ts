export const FINALIDADES_CONTA = ["POUPANCA", "RESERVA", "META", "INVESTIMENTO", "EMPRESA"] as const;

export type FinalidadeConta = (typeof FINALIDADES_CONTA)[number];

export const META_CASA_PADRAO = 10000;
export const RENDA_INVESTIMENTO_MES = 1000;
export const RENDA_EMPRESA_MES = 100;

export const ROTULOS_FINALIDADE: Record<FinalidadeConta, string> = {
  POUPANCA: "Poupança",
  RESERVA: "Reserva de emergência",
  META: "Meta",
  INVESTIMENTO: "Investimento",
  EMPRESA: "Empresa",
};

export const NOTAS_FINALIDADE: Record<FinalidadeConta, string> = {
  POUPANCA: "Renda que pode sacar quando precisar. Na retirada, o sistema sugere parcelas para repor sem deixar o mês negativo.",
  RESERVA: "Extras, saúde e se faltar emprego. Na retirada, o sistema sugere parcelas para repor sem deixar o mês negativo.",
  META: "Viagem, móveis e outros objetivos da casa. Dá para sacar à vista e devolver aos poucos, sem usar o cartão.",
  INVESTIMENTO: "Compra de ações. Esse dinheiro não sai. A renda passiva ajuda a pagar as contas.",
  EMPRESA: "Dinheiro para investir na empresa. A renda passiva volta para a empresa todo mês. Gasto da empresa sai daqui, com o que foi comprado.",
};

export const avisoSaque = (finalidade: FinalidadeConta) => {
  if (finalidade === "INVESTIMENTO") return "Esse dinheiro não sai para gasto do dia a dia.";
  if (finalidade === "EMPRESA") return "Sai só para gasto da empresa, anotado.";
  return null;
};

export const usaMetaEstoque = (finalidade: FinalidadeConta) => finalidade === "META";

export const usaMetaMensal = (finalidade: FinalidadeConta) =>
  finalidade === "INVESTIMENTO" || finalidade === "EMPRESA";

export const contaPodeSacar = (finalidade: FinalidadeConta) =>
  finalidade === "POUPANCA" || finalidade === "RESERVA" || finalidade === "META";

export type ContaEntrada = {
  nome: string;
  finalidade: FinalidadeConta;
  saldo: number;
  meta?: number | null;
  metaMensal?: number | null;
  ordem?: number;
};

export type ProgressoMeta = {
  temMeta: boolean;
  meta: number;
  saldo: number;
  percentual: number;
  percentualBarra: number;
  falta: number;
  atingida: boolean;
  excedente: number;
};

const numero = (valor: number | null | undefined) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export const isFinalidadeConta = (valor: unknown): valor is FinalidadeConta =>
  typeof valor === "string" && (FINALIDADES_CONTA as readonly string[]).includes(valor);

export const contasPadrao = (): ContaEntrada[] => [
  { nome: "Poupança", finalidade: "POUPANCA", saldo: 0, meta: null, metaMensal: null, ordem: 0 },
  { nome: "Reserva de emergência", finalidade: "RESERVA", saldo: 0, meta: null, metaMensal: null, ordem: 1 },
  { nome: "Meta", finalidade: "META", saldo: 0, meta: META_CASA_PADRAO, metaMensal: null, ordem: 2 },
  {
    nome: "Investimento",
    finalidade: "INVESTIMENTO",
    saldo: 0,
    meta: null,
    metaMensal: RENDA_INVESTIMENTO_MES,
    ordem: 3,
  },
  { nome: "Empresa", finalidade: "EMPRESA", saldo: 0, meta: null, metaMensal: RENDA_EMPRESA_MES, ordem: 4 },
];

export const calcularProgressoMeta = (
  saldo: number,
  meta: number | null | undefined,
): ProgressoMeta => {
  const saldoNum = numero(saldo);
  const metaNum = numero(meta);
  const temMeta = metaNum > 0;

  if (!temMeta) {
    return {
      temMeta: false,
      meta: 0,
      saldo: saldoNum,
      percentual: 0,
      percentualBarra: 0,
      falta: 0,
      atingida: false,
      excedente: 0,
    };
  }

  const percentual = (saldoNum / metaNum) * 100;
  const atingida = saldoNum + 0.005 >= metaNum;

  return {
    temMeta: true,
    meta: metaNum,
    saldo: saldoNum,
    percentual,
    percentualBarra: Math.min(100, Math.max(0, percentual)),
    falta: Math.max(0, metaNum - saldoNum),
    atingida,
    excedente: Math.max(0, saldoNum - metaNum),
  };
};

export const somarSaldos = (contas: { saldo: number }[]) =>
  contas.reduce((acc, conta) => acc + numero(conta.saldo), 0);

export const ordenarPorFinalidade = <T extends { finalidade: FinalidadeConta; ordem: number }>(contas: T[]) =>
  [...contas].sort((a, b) => {
    const ia = FINALIDADES_CONTA.indexOf(a.finalidade);
    const ib = FINALIDADES_CONTA.indexOf(b.finalidade);
    if (ia !== ib) return ia - ib;
    return a.ordem - b.ordem;
  });
