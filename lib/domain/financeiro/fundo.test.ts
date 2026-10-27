import { describe, expect, it } from "vitest";
import { FUNDO_APORTE, FUNDO_RENDIMENTO_ALVO, planejarFundo } from "./fundo";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

describe("planejarFundo", () => {
  it("aplica R$ 50 mais o rendimento inteiro enquanto o fundo rende menos de R$ 100", () => {
    const plano = planejarFundo({
      apertado: false,
      rendimentoFundo: 22.4,
      reinvestidoFundo: 22.4,
    });

    expect(plano.atingiuAlvo).toBe(false);
    quase(plano.aporte, FUNDO_APORTE);
    quase(plano.reaplicado, 22.4);
    quase(plano.proximo, 0);
    quase(plano.sugestao, 72.4);
  });

  it("divide o rendimento na metade quando o fundo rende R$ 100 no mês", () => {
    const plano = planejarFundo({
      apertado: false,
      rendimentoFundo: FUNDO_RENDIMENTO_ALVO,
      reinvestidoFundo: FUNDO_RENDIMENTO_ALVO,
    });

    expect(plano.atingiuAlvo).toBe(true);
    quase(plano.aporte, FUNDO_APORTE);
    quase(plano.reaplicado, 50);
    quase(plano.proximo, 50);
    quase(plano.sugestao, 100);
  });

  it("não sugere aporte quando o mês aperta", () => {
    const plano = planejarFundo({
      apertado: true,
      rendimentoFundo: 40,
      reinvestidoFundo: 0,
    });

    expect(plano.atingiuAlvo).toBe(false);
    quase(plano.aporte, 0);
    quase(plano.reaplicado, 0);
    quase(plano.proximo, 0);
    quase(plano.sugestao, 0);
  });
});
