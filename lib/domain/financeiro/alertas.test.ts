import { describe, expect, it } from "vitest";
import { alertasDoMes, sugerirDepositoMeta } from "./alertas";
import { calcularMes } from "./calcular-mes";
describe("alertas e regras da planilha", () => {
  it("não sugere depósito na meta quando sobrou é negativo", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 500 }],
      contas: [{ nome: "Aluguel", valor: 800 }],
      despesasVariaveis: { feira: 0, cartao: 200, gasolina: 0 },
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });

    expect(r.resumo.sobrou).toBeLessThan(0);
    expect(sugerirDepositoMeta(r)).toBe(0);
    expect(alertasDoMes({ competencia: "2026-02", resultado: r }).some((a) => a.id === "mes-negativo")).toBe(
      true,
    );
  });

  it("gasto individual é a sobra para consumo após contas e 10% na cascata", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 5000 }],
      contas: [{ nome: "Casa", valor: 1000 }],
      despesasVariaveis: { feira: 0, cartao: 0, gasolina: 0 },
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });

    quase(r.investimentos.poupanca.sugestao, 500);
    expect(r.distribuicao.gastoPessoal).toBeGreaterThan(0);
    const depoisInvestimento =
      r.prioridade.find((etapa) => etapa.id === "investimento")?.caixaDepois ?? 0;
    quase(r.distribuicao.gastoPessoal, depoisInvestimento * 0.45);
  });

  it("alerta parcela na última e fatura acima do teto", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 1000 }],
      contas: [{ nome: "Casa", valor: 800 }],
      despesasVariaveis: { feira: 0, cartao: 0, gasolina: 0 },
      cartaoFixo: 50,
      cartaoParcelas: 300,
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });

    expect(r.despesasVariaveis.cartao.estoura).toBe(true);
    const alertas = alertasDoMes({
      competencia: "2026-02",
      resultado: r,
      parcelas: [{ nome: "Notebook", atual: 12, total: 12, valor: 200, competencia: "2026-02" }],
    });
    expect(alertas.some((a) => a.id === "cartao-teto")).toBe(true);
    expect(alertas.some((a) => a.id.startsWith("parcela-fim-"))).toBe(true);
  });

  it("o investido reduz o teto do cartão", () => {
    const r = calcularMes({
      saldo: [{ nome: "Salário", valor: 3000 }],
      contas: [{ nome: "Casa", valor: 1000 }],
      investimentos: { fundo: 50, alttab: 100, poupanca: 300, poupancaEditado: true },
    });
    quase(r.saldoContas, 2000);
    quase(r.despesasVariaveis.cartao.teto, 1550);
  });
});

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};
