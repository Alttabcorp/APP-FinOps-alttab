export const ORDEM_PRIORIDADE = [
  { id: "contas", rotulo: "Contas fixas" },
  { id: "cartao", rotulo: "Cartão" },
  { id: "poupanca", rotulo: "Poupança" },
  { id: "feira", rotulo: "Feira" },
  { id: "investimento", rotulo: "Investimento" },
  { id: "pessoal", rotulo: "Gastos pessoais" },
  { id: "reposicao", rotulo: "Devolver à meta" },
  { id: "meta", rotulo: "Meta / investimento" },
] as const;

export const FRACAO_GASTO_PESSOAL = 0.1;

export type IdPrioridade = (typeof ORDEM_PRIORIDADE)[number]["id"];

export type StatusPrioridade = "ok" | "falta" | "vazio";

export type EtapaPrioridade = {
  id: IdPrioridade;
  ordem: number;
  rotulo: string;
  precisa: number;
  coberto: number;
  falta: number;
  caixaDepois: number;
  status: StatusPrioridade;
};

export type EntradaPrioridade = {
  caixa: number;
  valeAlimentacao: number;
  contas: number;
  cartao: number;
  poupanca: number;
  feira: number;
  investimento: number;
  gastoPessoal?: number | null;
  reposicaoMeta?: number | null;
};

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

const numero = (valor: number | null | undefined) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const statusDe = (precisa: number, falta: number): StatusPrioridade => {
  if (precisa < 0.005) return "vazio";
  if (falta < 0.005) return "ok";
  return "falta";
};

export const priorizarCaixa = (entrada: EntradaPrioridade): EtapaPrioridade[] => {
  let caixa = Math.max(0, round2(numero(entrada.caixa)));
  const etapas: EtapaPrioridade[] = [];

  const cobrir = (id: IdPrioridade, precisaBruta: number, reserva = 0) => {
    const precisa = round2(Math.max(0, numero(precisaBruta)));
    const daReserva = round2(Math.min(precisa, Math.max(0, numero(reserva))));
    const doCaixa = round2(Math.min(precisa - daReserva, caixa));
    caixa = round2(caixa - doCaixa);
    const coberto = round2(daReserva + doCaixa);
    const falta = round2(Math.max(0, precisa - coberto));
    const item = ORDEM_PRIORIDADE.find((etapa) => etapa.id === id);
    etapas.push({
      id,
      ordem: etapas.length + 1,
      rotulo: item?.rotulo ?? id,
      precisa,
      coberto,
      falta,
      caixaDepois: caixa,
      status: statusDe(precisa, falta),
    });
  };

  cobrir("contas", entrada.contas);
  cobrir("cartao", entrada.cartao);
  cobrir("poupanca", entrada.poupanca);
  cobrir("feira", Math.max(numero(entrada.feira), numero(entrada.valeAlimentacao)), entrada.valeAlimentacao);
  cobrir("investimento", entrada.investimento);

  const sobra = caixa;
  const alvoInformado = entrada.gastoPessoal;
  const alvoPessoal =
    alvoInformado == null
      ? round2(sobra * FRACAO_GASTO_PESSOAL)
      : round2(Math.max(0, numero(alvoInformado)));
  cobrir("pessoal", Math.min(alvoPessoal, sobra));
  cobrir("reposicao", entrada.reposicaoMeta ?? 0);

  const meta = round2(caixa);
  caixa = 0;
  etapas.push({
    id: "meta",
    ordem: etapas.length + 1,
    rotulo: "Meta / investimento",
    precisa: meta,
    coberto: meta,
    falta: 0,
    caixaDepois: 0,
    status: meta < 0.005 ? "vazio" : "ok",
  });

  return etapas;
};
