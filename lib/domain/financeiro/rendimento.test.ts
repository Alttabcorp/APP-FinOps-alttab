import { describe, expect, it } from "vitest";
import { destinarRendimento } from "./rendimento";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

describe("destinarRendimento", () => {
  it("reinveste tudo quando o caixa cobre as contas", () => {
    const destino = destinarRendimento({
      caixa: 3000,
      contas: 800,
      cartao: 200,
      rendimentoFundo: 40,
      rendimentoPoupanca: 15,
    });

    expect(destino.apertado).toBe(false);
    quase(destino.paraContas, 0);
    quase(destino.reinvestidoFundo, 40);
    quase(destino.reinvestidoPoupanca, 15);
    quase(destino.reinvestido, 55);
  });

  it("usa o rendimento da poupança nas contas se o mês apertar", () => {
    const destino = destinarRendimento({
      caixa: 500,
      contas: 800,
      cartao: 0,
      rendimentoFundo: 40,
      rendimentoPoupanca: 200,
    });

    expect(destino.apertado).toBe(true);
    quase(destino.faltaSemRendimento, 300);
    quase(destino.paraContasPoupanca, 200);
    quase(destino.paraContasFundo, 40);
    quase(destino.paraContas, 240);
    quase(destino.reinvestido, 0);
  });

  it("reinveste o que sobrar depois de cobrir a falta", () => {
    const destino = destinarRendimento({
      caixa: 500,
      contas: 700,
      cartao: 100,
      rendimentoFundo: 80,
      rendimentoPoupanca: 250,
    });

    expect(destino.apertado).toBe(true);
    quase(destino.faltaSemRendimento, 300);
    quase(destino.paraContasPoupanca, 250);
    quase(destino.paraContasFundo, 50);
    quase(destino.reinvestidoFundo, 30);
    quase(destino.reinvestidoPoupanca, 0);
  });
});
