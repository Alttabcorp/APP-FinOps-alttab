import { describe, expect, it } from "vitest";
import {
  devolverGastoEmpresa,
  gastosNaCompetencia,
  retirarDaEmpresa,
  totalGastosEmpresa,
} from "./gasto-empresa";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

describe("gasto da empresa", () => {
  it("tira da empresa só o que tem e anota o valor", () => {
    const saida = retirarDaEmpresa(500, 120);
    quase(saida.saldo, 380);
    quase(saida.gasto, 120);
    expect(() => retirarDaEmpresa(50, 50.01)).toThrow(/não tem saldo/i);
    expect(() => retirarDaEmpresa(50, 0)).toThrow(/valor do gasto/i);
  });

  it("devolve o saldo se o gasto for desfeito", () => {
    const volta = devolverGastoEmpresa(380, 120);
    quase(volta.saldo, 500);
  });

  it("soma o que saiu no mês e o total", () => {
    const gastos = [
      { nome: "Domínio", valor: 80, competencia: "2026-10" },
      { nome: "Canetas", nota: "papelaria", valor: 25.5, competencia: "2026-10" },
      { nome: "Máquina virtual", valor: 40, competencia: "2026-09" },
    ];
    quase(totalGastosEmpresa(gastosNaCompetencia(gastos, "2026-10")), 105.5);
    quase(totalGastosEmpresa(gastos), 145.5);
    expect(gastosNaCompetencia(gastos, "2026-11")).toEqual([]);
  });
});
