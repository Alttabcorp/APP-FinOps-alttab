import { describe, expect, it } from "vitest";
import { priorizarCaixa } from "./prioridade";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

describe("priorizarCaixa", () => {
  it("paga contas e cartão antes da poupança", () => {
    const etapas = priorizarCaixa({
      caixa: 1000,
      valeAlimentacao: 0,
      contas: 700,
      cartao: 200,
      poupanca: 150,
      feira: 0,
      investimento: 100,
    });
    const contas = etapas.find((etapa) => etapa.id === "contas");
    const cartao = etapas.find((etapa) => etapa.id === "cartao");
    const poupanca = etapas.find((etapa) => etapa.id === "poupanca");
    const investimento = etapas.find((etapa) => etapa.id === "investimento");
    const meta = etapas.find((etapa) => etapa.id === "meta");

    expect(contas?.status).toBe("ok");
    expect(cartao?.status).toBe("ok");
    expect(poupanca?.status).toBe("falta");
    quase(poupanca?.coberto ?? 0, 100);
    quase(poupanca?.falta ?? 0, 50);
    expect(investimento?.status).toBe("falta");
    quase(investimento?.coberto ?? 0, 0);
    expect(meta?.status).toBe("vazio");
  });

  it("a feira usa o vale-alimentação e não compete com as contas", () => {
    const etapas = priorizarCaixa({
      caixa: 200,
      valeAlimentacao: 400,
      contas: 200,
      cartao: 0,
      poupanca: 0,
      feira: 400,
      investimento: 0,
    });
    expect(etapas.find((etapa) => etapa.id === "contas")?.status).toBe("ok");
    expect(etapas.find((etapa) => etapa.id === "feira")?.status).toBe("ok");
    quase(etapas.find((etapa) => etapa.id === "feira")?.coberto ?? 0, 400);
  });

  it("deixa um valor para gasto pessoal e o resto vai para a meta", () => {
    const etapas = priorizarCaixa({
      caixa: 2000,
      valeAlimentacao: 300,
      contas: 800,
      cartao: 200,
      poupanca: 200,
      feira: 300,
      investimento: 150,
    });
    const pessoal = etapas.find((etapa) => etapa.id === "pessoal");
    const meta = etapas.find((etapa) => etapa.id === "meta");
    expect(pessoal?.status).toBe("ok");
    quase(pessoal?.coberto ?? 0, 65);
    expect(meta?.status).toBe("ok");
    quase(meta?.precisa ?? 0, 585);
  });

  it("usa o valor de gasto pessoal informado e manda o resto para a meta", () => {
    const etapas = priorizarCaixa({
      caixa: 2000,
      valeAlimentacao: 0,
      contas: 800,
      cartao: 200,
      poupanca: 200,
      feira: 0,
      investimento: 150,
      gastoPessoal: 400,
    });
    quase(etapas.find((etapa) => etapa.id === "pessoal")?.coberto ?? 0, 400);
    quase(etapas.find((etapa) => etapa.id === "meta")?.coberto ?? 0, 250);
  });

  it("devolve o saque da meta antes de juntar extra", () => {
    const etapas = priorizarCaixa({
      caixa: 2000,
      valeAlimentacao: 0,
      contas: 800,
      cartao: 200,
      poupanca: 200,
      feira: 0,
      investimento: 150,
      gastoPessoal: 400,
      reposicaoMeta: 200,
    });
    const reposicao = etapas.find((etapa) => etapa.id === "reposicao");
    const meta = etapas.find((etapa) => etapa.id === "meta");
    expect(reposicao?.status).toBe("ok");
    quase(reposicao?.coberto ?? 0, 200);
    quase(meta?.coberto ?? 0, 50);
  });
});
