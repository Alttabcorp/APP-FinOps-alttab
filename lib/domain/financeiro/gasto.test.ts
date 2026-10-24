import { describe, expect, it } from "vitest";
import { analisarGastos, classificarNomeGasto } from "./gasto";

describe("classificarNomeGasto", () => {
  it("separa água da água mineral", () => {
    expect(classificarNomeGasto("Água")).toBe("agua");
    expect(classificarNomeGasto("Água mineral")).toBe("agua_mineral");
  });

  it("reconhece ração, energia e combustível", () => {
    expect(classificarNomeGasto("Ração dos pets")).toBe("racao");
    expect(classificarNomeGasto("Energia")).toBe("energia");
    expect(classificarNomeGasto("Gasolina")).toBe("combustivel");
    expect(classificarNomeGasto("Gás")).toBe("gas");
  });
});

describe("analisarGastos", () => {
  it("soma feira, cartão e contas e aponta o maior", () => {
    const analise = analisarGastos({
      itens: [
        { tipo: "CONTA", nome: "Energia", valor: 180 },
        { tipo: "CONTA", nome: "Água", valor: 70 },
        { tipo: "EXTRA_MES", nome: "Ração", valor: 90 },
        { tipo: "SALDO", nome: "Projeto", valor: 3000 },
      ],
      feira: 400,
      gasolina: 120,
      cartaoAvulso: 30,
      faturaCartao: 100,
      parcelasCartao: [{ nome: "PC 1/12", valor: 100 }],
    });
    expect(analise.total).toBeCloseTo(990, 2);
    expect(analise.maior?.categoria).toBe("feira");
    expect(analise.perguntas.find((linha) => linha.categoria === "racao")?.valor).toBeCloseTo(90, 2);
    expect(analise.perguntas.find((linha) => linha.categoria === "cartao")?.valor).toBeCloseTo(130, 2);
    expect(analise.ranking[0]?.rotulo).toBe("Feira");
  });

  it("avisa quando o gasto sobe e quando falta informar", () => {
    const analise = analisarGastos(
      {
        itens: [{ tipo: "CONTA", nome: "Energia", valor: 220 }],
        feira: 0,
        gasolina: 80,
        cartaoAvulso: 0,
        faturaCartao: 0,
      },
      {
        itens: [{ tipo: "CONTA", nome: "Energia", valor: 180 }],
        feira: 0,
        gasolina: 80,
        cartaoAvulso: 0,
        faturaCartao: 0,
      },
      { feira: 200, gasolina: 50 },
    );
    expect(analise.pistas.some((pista) => pista.id === "subiu-energia")).toBe(true);
    expect(analise.pistas.some((pista) => pista.id === "gasolina-vt")).toBe(true);
    expect(analise.pistas.some((pista) => pista.id === "falta-feira")).toBe(true);
  });
});
