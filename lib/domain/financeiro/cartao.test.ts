import { describe, expect, it } from "vitest";
import { faturaDoMes, parcelaNaCompetencia, planejarCartao, valorDaParcela } from "./cartao";

describe("parcela de cartão", () => {
  const pc = {
    nome: "PC",
    valorTotal: 1200,
    parcelas: 12,
    competenciaInicio: "2026-10",
  };

  it("divide o PC em 12 vezes e acerta a primeira e a última", () => {
    const primeira = parcelaNaCompetencia(pc, "2026-10");
    const ultima = parcelaNaCompetencia(pc, "2027-09");
    const depois = parcelaNaCompetencia(pc, "2027-10");
    expect(primeira).toMatchObject({ atual: 1, total: 12, valor: 100 });
    expect(ultima).toMatchObject({ atual: 12, total: 12, valor: 100 });
    expect(depois).toBeNull();
    expect(valorDaParcela(100, 3, 0)).toBeCloseTo(33.33, 2);
    expect(valorDaParcela(100, 3, 2)).toBeCloseTo(33.34, 2);
  });

  it("soma a fatura do mês com todas as compras ativas", () => {
    const fatura = faturaDoMes(
      [pc, { nome: "Geladeira", valorTotal: 300, parcelas: 3, competenciaInicio: "2026-10" }],
      "2026-10",
    );
    expect(fatura).toBeCloseTo(200, 2);
  });

  it("o teto do cartão é o que sobrou depois das contas", () => {
    const plano = planejarCartao({ saldoContas: 2200, fixo: 200, parcelas: 100, avulso: 50 });
    expect(plano.teto).toBeCloseTo(2200, 2);
    expect(plano.disponivel).toBeCloseTo(1900, 2);
    expect(plano.fatura).toBeCloseTo(350, 2);
    expect(plano.cabe).toBeCloseTo(1850, 2);
    expect(plano.estoura).toBe(false);
    expect(planejarCartao({ saldoContas: 200, fixo: 150, parcelas: 100 }).estoura).toBe(true);
  });
});
