import { describe, expect, it } from "vitest";
import {
  compararComAnterior,
  mesDoMaior,
  somarContaClassificada,
  somaNoPeriodo,
  type LinhaAcompanhar,
} from "./acompanhar";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

const linha = (parcial: Partial<LinhaAcompanhar> & { competencia: string }): LinhaAcompanhar => ({
  salario: 0,
  ganhou: 0,
  gasto: 0,
  sobrou: 0,
  cartao: 0,
  agua: 0,
  energia: 0,
  poupanca: 0,
  fundo: 0,
  alttab: 0,
  investido: 0,
  paraMeta: 0,
  fechado: false,
  ...parcial,
});

describe("acompanhar", () => {
  it("soma água e energia pelas contas do mês", () => {
    const itens = [
      { tipo: "CONTA", nome: "Água", valor: 55 },
      { tipo: "CONTA", nome: "Energia", valor: 44.5 },
      { tipo: "EXTRA_MES", nome: "Água mineral", valor: 58 },
      { tipo: "SALDO", nome: "HUJB", valor: 1800 },
    ];
    quase(somarContaClassificada(itens, "agua"), 55);
    quase(somarContaClassificada(itens, "energia"), 44.5);
    quase(somarContaClassificada(itens, "agua_mineral"), 58);
  });

  it("aponta o mês que mais gastou e o cartão mais alto", () => {
    const meses = [
      linha({ competencia: "2026-08", gasto: 2100, cartao: 800, agua: 40, energia: 90 }),
      linha({ competencia: "2026-09", gasto: 3400, cartao: 1200, agua: 70, energia: 50 }),
      linha({ competencia: "2026-10", gasto: 2800, cartao: 400, agua: 55, energia: 120 }),
    ];
    expect(mesDoMaior(meses, "gasto")?.competencia).toBe("2026-09");
    quase(mesDoMaior(meses, "gasto")?.valor ?? 0, 3400);
    expect(mesDoMaior(meses, "cartao")?.competencia).toBe("2026-09");
    expect(mesDoMaior(meses, "agua")?.competencia).toBe("2026-09");
    expect(mesDoMaior(meses, "energia")?.competencia).toBe("2026-10");
  });

  it("não aponta pico quando a série está zerada", () => {
    const meses = [linha({ competencia: "2026-10", gasto: 0, cartao: 0 })];
    expect(mesDoMaior(meses, "cartao")).toBeNull();
  });

  it("compara o salário com o mês anterior", () => {
    const meses = [
      linha({ competencia: "2026-09", salario: 4000 }),
      linha({ competencia: "2026-10", salario: 4320 }),
    ];
    const comparativo = compararComAnterior(meses, "salario");
    quase(comparativo?.delta ?? 0, 320);
    expect(comparativo?.anterior.competencia).toBe("2026-09");
  });

  it("soma os aportes do período", () => {
    const meses = [
      linha({ competencia: "2026-09", poupanca: 400, fundo: 50 }),
      linha({ competencia: "2026-10", poupanca: 432, fundo: 72.4 }),
    ];
    quase(somaNoPeriodo(meses, "poupanca"), 832);
    quase(somaNoPeriodo(meses, "fundo"), 122.4);
  });
});
