export type EntradaRendimento = {
  caixa: number;
  contas: number;
  cartao: number;
  rendimentoFundo: number;
  rendimentoPoupanca: number;
};

export type DestinoRendimento = {
  fundo: number;
  poupanca: number;
  total: number;
  apertado: boolean;
  faltaSemRendimento: number;
  paraContas: number;
  paraContasFundo: number;
  paraContasPoupanca: number;
  reinvestidoFundo: number;
  reinvestidoPoupanca: number;
  reinvestido: number;
};

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

const numero = (valor: number | null | undefined) => {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

export const destinarRendimento = (entrada: EntradaRendimento): DestinoRendimento => {
  const caixa = round2(numero(entrada.caixa));
  const obrigacoes = round2(numero(entrada.contas) + numero(entrada.cartao));
  const faltaSemRendimento = round2(Math.max(0, obrigacoes - caixa));
  const apertado = faltaSemRendimento >= 0.005;

  const fundo = round2(numero(entrada.rendimentoFundo));
  const poupanca = round2(numero(entrada.rendimentoPoupanca));
  const total = round2(fundo + poupanca);

  const paraContasPoupanca = round2(Math.min(poupanca, faltaSemRendimento));
  const faltaDepoisPoupanca = round2(Math.max(0, faltaSemRendimento - paraContasPoupanca));
  const paraContasFundo = round2(Math.min(fundo, faltaDepoisPoupanca));
  const paraContas = round2(paraContasPoupanca + paraContasFundo);
  const reinvestidoFundo = round2(fundo - paraContasFundo);
  const reinvestidoPoupanca = round2(poupanca - paraContasPoupanca);
  const reinvestido = round2(reinvestidoFundo + reinvestidoPoupanca);

  return {
    fundo,
    poupanca,
    total,
    apertado,
    faltaSemRendimento,
    paraContas,
    paraContasFundo,
    paraContasPoupanca,
    reinvestidoFundo,
    reinvestidoPoupanca,
    reinvestido,
  };
};
