import { describe, expect, it } from "vitest";
import { calcularMes, identificarExtras, inferirPapelExtra } from "./calcular-mes";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

describe("calcularMes", () => {
  it("aplica as fórmulas do caderno com os valores de exemplo", () => {
    const r = calcularMes({
      saldo: [
        { nome: "Projeto", valor: 1500 },
        { nome: "Pesquisa", valor: 2000 },
        { nome: "HUJB", valor: 1969.64 },
      ],
      extra: [
        { nome: "Vale-Transporte", valor: 127.4, papel: "VALE_TRANSPORTE" },
        { nome: "Vale-Alimentação", valor: 465.5, papel: "VALE_ALIMENTACAO" },
        { nome: "Provento Fundo", valor: 22.4, papel: "PROVENTO_FUNDO" },
      ],
      contas: [
        { nome: "Crédito celular", valor: 60 },
        { nome: "Magazine Luiza", valor: 138 },
        { nome: "Celular", valor: 260 },
        { nome: "Internet", valor: 39 },
        { nome: "Casa", valor: 615.53 },
        { nome: "Manutenção Caixa", valor: 35.5 },
        { nome: "Energia", valor: 44.5 },
        { nome: "Água mineral", valor: 58 },
        { nome: "Água", valor: 55 },
        { nome: "Ração", valor: 40 },
        { nome: "Academia", valor: 209.8 },
      ],
      extraMes: [{ nome: "Gás", valor: 120 }],
      despesasVariaveis: { feira: 465.5, cartao: 2321, gasolina: 108.19 },
      investimentos: { fundo: 41.61, alttab: 100, poupanca: 0, poupancaEditado: false },
    });

    quase(r.totalSaldo, 5469.64);
    quase(r.ganhoMes, 6084.94);
    quase(r.saldoContas, 3921.71);
    quase(r.investimentos.fundo.base, 50);
    quase(r.investimentos.fundo.ajuste, 22.4);
    quase(r.investimentos.fundo.sugestao, 72.4);
    quase(r.investimentos.fundo.proximo, 0);
    expect(r.investimentos.fundo.atingiuAlvo).toBe(false);
    quase(r.investimentos.poupanca.sugestao, 546.964);
    quase(
      r.distribuicao.gastoPessoal + r.distribuicao.reposicaoMeta + r.distribuicao.metaFinal,
      r.prioridade.find((etapa) => etapa.id === "investimento")?.caixaDepois ?? 0,
    );
    quase(r.distribuicao.gastoPessoal, (r.prioridade.find((etapa) => etapa.id === "investimento")?.caixaDepois ?? 0) * 0.1);
  });

  it("reinveste o rendimento inteiro quando o caixa cobre as contas", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 1000 }],
      extra: [
        { nome: "VT", valor: 100, papel: "VALE_TRANSPORTE" },
        { nome: "Provento", valor: 100, papel: "PROVENTO_FUNDO" },
      ],
      despesasVariaveis: { feira: 0, cartao: 0, gasolina: 20 },
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });

    quase(r.investimentos.fundo.base, 50);
    quase(r.investimentos.fundo.ajuste, 50);
    quase(r.rendimento.paraContas, 0);
    quase(r.investimentos.fundo.sugestao, 100);
    quase(r.investimentos.fundo.proximo, 50);
    expect(r.investimentos.fundo.atingiuAlvo).toBe(true);
    expect(r.rendimento.apertado).toBe(false);
  });

  it("reaplica o rendimento inteiro no fundo enquanto ele rende menos de R$ 100", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 2000 }],
      extra: [{ nome: "Provento", valor: 40, papel: "PROVENTO_FUNDO" }],
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });

    expect(r.investimentos.fundo.atingiuAlvo).toBe(false);
    quase(r.investimentos.fundo.base, 50);
    quase(r.investimentos.fundo.ajuste, 40);
    quase(r.investimentos.fundo.sugestao, 90);
    quase(r.investimentos.fundo.proximo, 0);
  });

  it("usa o rendimento nas contas quando o mês aperta", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 500 }],
      extra: [
        { nome: "Provento fundo", valor: 40, papel: "PROVENTO_FUNDO" },
        { nome: "Rendimento da poupança", valor: 260, papel: "PROVENTO_POUPANCA" },
      ],
      contas: [{ nome: "Internet", valor: 800 }],
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });

    expect(r.rendimento.apertado).toBe(true);
    quase(r.rendimento.paraContas, 300);
    quase(r.rendimento.reinvestido, 0);
    quase(r.saldoContas, 0);
    quase(r.investimentos.fundo.ajuste, 0);
    quase(r.investimentos.fundo.base, 0);
    quase(r.investimentos.fundo.sugestao, 0);
    quase(r.investimentos.alttab.sugestao, 0);
  });

  it("desconta IPTU e domínio do caixa do mês", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 3000 }],
      contas: [{ nome: "Internet", valor: 100 }],
      anuais: [
        { nome: "IPTU 1/10", valor: 120 },
        { nome: "Domínio do site", valor: 80 },
      ],
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });

    quase(r.totalAnual, 200);
    quase(r.gastoMensal, 300);
    quase(r.saldoContas, 2700);
  });

  it("devolve o saque da meta antes de juntar extra", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 2000 }],
      contas: [{ nome: "Internet", valor: 800 }],
      despesasVariaveis: { feira: 0, cartao: 200, gasolina: 0 },
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
      gastoPessoalAlvo: 400,
      reposicaoMeta: 200,
    });
    quase(r.distribuicao.gastoPessoal, 400);
    quase(r.distribuicao.reposicaoMeta, 200);
    quase(r.distribuicao.metaFinal, 50);
  });

  it("usa o vale-transporte no caixa das contas e deixa o VA só na feira", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 1000 }],
      extra: [
        { nome: "VT", valor: 100, papel: "VALE_TRANSPORTE" },
        { nome: "VA", valor: 400, papel: "VALE_ALIMENTACAO" },
      ],
      contas: [{ nome: "Internet", valor: 200 }],
      despesasVariaveis: { feira: 0, cartao: 0, gasolina: 0 },
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });

    quase(r.saldoContas, 900);
    quase(r.despesasVariaveis.feira.sugestao, 400);
    quase(r.valeAlimentacao, 400);
  });

  it("usa o que sobra depois das contas como teto do cartão e avisa se estourar", () => {
    const cabe = calcularMes({
      saldo: [{ nome: "Salário", valor: 3000 }],
      contas: [{ nome: "Internet", valor: 800 }],
      cartaoFixo: 200,
      cartaoParcelas: 100,
      despesasVariaveis: { feira: 0, cartao: 0, gasolina: 0 },
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });
    quase(cabe.saldoContas, 2200);
    quase(cabe.despesasVariaveis.cartao.teto, 2200);
    quase(cabe.despesasVariaveis.cartao.fixo, 200);
    quase(cabe.despesasVariaveis.cartao.disponivel, 1900);
    quase(cabe.despesasVariaveis.cartao.fatura, 300);
    expect(cabe.despesasVariaveis.cartao.estoura).toBe(false);

    const estoura = calcularMes({
      saldo: [{ nome: "Salário", valor: 1000 }],
      contas: [{ nome: "Internet", valor: 800 }],
      cartaoFixo: 150,
      cartaoParcelas: 50,
      despesasVariaveis: { feira: 0, cartao: 100, gasolina: 0 },
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });
    quase(estoura.despesasVariaveis.cartao.teto, 200);
    quase(estoura.despesasVariaveis.cartao.fatura, 300);
    expect(estoura.despesasVariaveis.cartao.estoura).toBe(true);
    quase(estoura.despesasVariaveis.cartao.cabe, 0);
  });

  it("identifica extras pelo nome quando o papel não vem preenchido", () => {
    expect(inferirPapelExtra("Vale Transporte")).toBe("VALE_TRANSPORTE");
    expect(inferirPapelExtra("Rendimento da poupança")).toBe("PROVENTO_POUPANCA");
    const ids = identificarExtras([
      { nome: "Vale Alimentação", valor: 20 },
      { nome: "Provento fundo", valor: 5 },
      { nome: "Rendimento da poupança", valor: 8 },
    ]);
    quase(ids.valeAlimentacao, 20);
    quase(ids.proventoFundo, 5);
    quase(ids.proventoPoupanca, 8);
  });
});
