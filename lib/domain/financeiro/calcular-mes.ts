import { planejarCartao } from "./cartao";
import { planejarFundo } from "./fundo";
import { priorizarCaixa } from "./prioridade";
import { destinarRendimento } from "./rendimento";
import {
  ALTTAB_SUGESTAO,
  type EntradaMes,
  type ItemFinanceiro,
  type PapelExtra,
  type ResultadoMes,
} from "./tipos";

const somarItens = (itens: ItemFinanceiro[]) =>
  itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

export const inferirPapelExtra = (nome: string): PapelExtra => {
  const n = nome.toLowerCase().trim();
  if (n.includes("vale") && n.includes("transporte")) return "VALE_TRANSPORTE";
  if (n.includes("vale") && n.includes("alimenta")) return "VALE_ALIMENTACAO";
  if (n.includes("poupan")) return "PROVENTO_POUPANCA";
  if (n.includes("provento") || n.includes("rendimento") || n.includes("fundo")) return "PROVENTO_FUNDO";
  return "OUTRO";
};

export const identificarExtras = (extra: ItemFinanceiro[]) => {
  let valeTransporte = 0;
  let valeAlimentacao = 0;
  let proventoFundo = 0;
  let proventoPoupanca = 0;

  extra.forEach((item) => {
    const papel = item.papel ?? inferirPapelExtra(item.nome);
    const valor = Number(item.valor) || 0;
    if (papel === "VALE_TRANSPORTE") valeTransporte += valor;
    else if (papel === "VALE_ALIMENTACAO") valeAlimentacao += valor;
    else if (papel === "PROVENTO_FUNDO") proventoFundo += valor;
    else if (papel === "PROVENTO_POUPANCA") proventoPoupanca += valor;
  });

  return { valeTransporte, valeAlimentacao, proventoFundo, proventoPoupanca };
};

const par = (sugestao: number, real: number) => ({
  sugestao,
  real,
  variacao: real - sugestao,
});

export const calcularMes = (input: Partial<EntradaMes> = {}): ResultadoMes => {
  const saldo = input.saldo ?? [];
  const extra = input.extra ?? [];
  const contas = input.contas ?? [];
  const extraMes = input.extraMes ?? [];
  const anuais = input.anuais ?? [];
  const dv = input.despesasVariaveis ?? { feira: 0, cartao: 0, gasolina: 0 };
  const inv = input.investimentos ?? {
    fundo: 0,
    alttab: 0,
    poupanca: 0,
    poupancaEditado: false,
  };

  const totalSaldo = somarItens(saldo);
  const totalExtra = somarItens(extra);
  const { valeTransporte, valeAlimentacao, proventoFundo, proventoPoupanca } = identificarExtras(extra);
  const ganhoMes = totalSaldo + totalExtra;

  const totalContas = somarItens(contas);
  const totalExtraMes = somarItens(extraMes);
  const totalAnual = somarItens(anuais);
  const gastoMensal = totalContas + totalExtraMes + totalAnual;

  const feiraReal = Number(dv.feira) || 0;
  const cartaoAvulso = Number(dv.cartao) || 0;
  const cartaoFixo = Number(input.cartaoFixo) || 0;
  const cartaoParcelas = Number(input.cartaoParcelas) || 0;
  const gasolinaReal = Number(dv.gasolina) || 0;

  const caixaOperacional = totalSaldo + valeTransporte;
  const rendimento = destinarRendimento({
    caixa: caixaOperacional,
    contas: gastoMensal,
    cartao: cartaoFixo + cartaoParcelas + cartaoAvulso,
    rendimentoFundo: proventoFundo,
    rendimentoPoupanca: proventoPoupanca,
  });

  const saldoContas = caixaOperacional + rendimento.paraContas - gastoMensal;

  const poupancaSugestao = totalSaldo * 0.1 + rendimento.reinvestidoPoupanca;
  const fundo = planejarFundo({
    apertado: rendimento.apertado,
    rendimentoFundo: proventoFundo,
    reinvestidoFundo: rendimento.reinvestidoFundo,
  });

  // O que sobra depois de contas, cartão, feira, gasolina e poupança (10%) é dividido
  // em 4 partes iguais: reserva, fundo, empresa e meta.
  const gasolinaReserva = Math.max(gasolinaReal, valeTransporte);
  const feiraExtra = Math.max(0, feiraReal - valeAlimentacao);
  const faturaEstimada = cartaoFixo + cartaoParcelas + cartaoAvulso;
  const disponivelInvestir = rendimento.apertado
    ? 0
    : Math.max(
        0,
        saldoContas -
          gasolinaReserva -
          faturaEstimada -
          poupancaSugestao -
          feiraExtra -
          (Number(input.reposicaoMeta) || 0) -
          (Number(input.gastoPessoalAlvo) || 0),
      );
  const parteInvestir = Math.floor((disponivelInvestir / 4) * 100) / 100;
  const fundoBase = parteInvestir;
  const reservaSugestao = parteInvestir;
  const alttabSugestao = parteInvestir;
  const metaSugestao = parteInvestir;
  const fundoSugestao = Math.round((parteInvestir + fundo.reaplicado) * 100) / 100;

  const fundoReal = inv.fundoEditado === false ? fundoSugestao : Number(inv.fundo) || 0;
  const alttabReal = inv.alttabEditado === false ? alttabSugestao : Number(inv.alttab) || 0;
  // Reserva e meta: ausente ou falso = sugestão; só true trava o valor informado.
  const reservaReal = inv.reservaEditado === true ? Number(inv.reserva) || 0 : reservaSugestao;
  const metaReal = inv.metaEditado === true ? Number(inv.meta) || 0 : metaSugestao;
  const poupancaReal = inv.poupancaEditado ? Number(inv.poupanca) || 0 : poupancaSugestao;
  const totalInvestido = fundoReal + alttabReal + poupancaReal + reservaReal + metaReal;

  const cartao = planejarCartao({
    // Teto do cartão = caixa das contas − o que já foi investido (regra da planilha).
    saldoContas: saldoContas - totalInvestido,
    fixo: cartaoFixo,
    parcelas: cartaoParcelas,
    avulso: cartaoAvulso,
  });
  const ganhou = ganhoMes;
  const gasto = gastoMensal + totalInvestido + feiraReal + cartao.fatura + gasolinaReal;
  const sobrou = ganhou - gasto;

  const prioridade = priorizarCaixa({
    caixa: Math.max(0, caixaOperacional + rendimento.paraContas - gasolinaReserva),
    valeAlimentacao,
    contas: gastoMensal,
    cartao: cartao.fatura,
    poupanca: poupancaSugestao,
    feira: Math.max(feiraReal, valeAlimentacao),
    investimento: reservaSugestao + fundoSugestao + alttabSugestao + metaSugestao,
    gastoPessoal: input.gastoPessoalAlvo,
    reposicaoMeta: input.reposicaoMeta,
  });
  const gastoPessoal = prioridade.find((etapa) => etapa.id === "pessoal")?.coberto ?? 0;
  const reposicaoMeta = prioridade.find((etapa) => etapa.id === "reposicao")?.coberto ?? 0;
  const metaFinal = metaReal;

  return {
    totalSaldo,
    totalExtra,
    ganhoMes,
    valeTransporte,
    valeAlimentacao,
    proventoFundo,
    proventoPoupanca,
    rendimento,
    totalContas,
    totalExtraMes,
    totalAnual,
    gastoMensal,
    saldoContas,
    despesasVariaveis: {
      feira: par(valeAlimentacao, feiraReal),
      cartao: {
        ...par(cartao.teto, cartao.fatura),
        ...cartao,
      },
      gasolina: par(valeTransporte, gasolinaReal),
    },
    investimentos: {
      fundo: {
        ...par(fundoSugestao, fundoReal),
        base: fundoBase,
        ajuste: fundo.reaplicado,
        proximo: fundo.proximo,
        atingiuAlvo: fundo.atingiuAlvo,
      },
      alttab: par(alttabSugestao, alttabReal),
      poupanca: par(poupancaSugestao, poupancaReal),
      reserva: par(reservaSugestao, reservaReal),
      meta: par(metaSugestao, metaReal),
      totalInvestido,
    },
    resumo: { ganhou, gasto, sobrou },
    distribuicao: { metaFinal, gastoPessoal, reposicaoMeta },
    prioridade,
  };
};
