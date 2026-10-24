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
  const cartaoReal = Number(dv.cartao) || 0;
  const gasolinaReal = Number(dv.gasolina) || 0;

  const caixaOperacional = totalSaldo + valeTransporte;
  const rendimento = destinarRendimento({
    caixa: caixaOperacional,
    contas: gastoMensal,
    cartao: cartaoReal,
    rendimentoFundo: proventoFundo,
    rendimentoPoupanca: proventoPoupanca,
  });

  const saldoContas = caixaOperacional + rendimento.paraContas - gastoMensal;

  const poupancaSugestao = totalSaldo * 0.1 + rendimento.reinvestidoPoupanca;
  const alttabSugestao = ALTTAB_SUGESTAO;
  const fundoBase = Math.max(0, valeTransporte - gasolinaReal);
  const fundoSugestao = fundoBase + rendimento.reinvestidoFundo;

  const fundoReal = Number(inv.fundo) || 0;
  const alttabReal = Number(inv.alttab) || 0;
  const poupancaReal = inv.poupancaEditado ? Number(inv.poupanca) || 0 : poupancaSugestao;
  const totalInvestido = fundoReal + alttabReal + poupancaReal;

  const ganhou = ganhoMes;
  const gasto = gastoMensal + totalInvestido + feiraReal + cartaoReal + gasolinaReal;
  const sobrou = ganhou - gasto;

  const prioridade = priorizarCaixa({
    caixa: caixaOperacional + rendimento.paraContas,
    valeAlimentacao,
    contas: gastoMensal,
    cartao: cartaoReal,
    poupanca: poupancaSugestao,
    feira: Math.max(feiraReal, valeAlimentacao),
    investimento: fundoSugestao + alttabSugestao,
    gastoPessoal: input.gastoPessoalAlvo,
    reposicaoMeta: input.reposicaoMeta,
  });
  const gastoPessoal = prioridade.find((etapa) => etapa.id === "pessoal")?.coberto ?? 0;
  const reposicaoMeta = prioridade.find((etapa) => etapa.id === "reposicao")?.coberto ?? 0;
  const metaFinal = prioridade.find((etapa) => etapa.id === "meta")?.coberto ?? 0;

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
      cartao: par(saldoContas - totalInvestido, cartaoReal),
      gasolina: par(valeTransporte, gasolinaReal),
    },
    investimentos: {
      fundo: { ...par(fundoSugestao, fundoReal), base: fundoBase, ajuste: rendimento.reinvestidoFundo },
      alttab: par(alttabSugestao, alttabReal),
      poupanca: par(poupancaSugestao, poupancaReal),
      totalInvestido,
    },
    resumo: { ganhou, gasto, sobrou },
    distribuicao: { metaFinal, gastoPessoal, reposicaoMeta },
    prioridade,
  };
};
