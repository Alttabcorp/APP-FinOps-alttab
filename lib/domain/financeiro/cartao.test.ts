import { describe, expect, it } from "vitest";
import {
  avulsosCompraDoMes,
  faturaAvulsosCompraDoMes,
  faturaDoMes,
  faturaParcelasDoMes,
  parcelaNaCompetencia,
  parcelasDoMes,
  planejarCartao,
  valorDaParcela,
  competenciaDaFatura,
  dataPagamentoDaFatura,
} from "./cartao";

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

  it("lápis em 3x aparece só nos 3 meses do prazo", () => {
    const lapis = {
      nome: "Lápis",
      valorTotal: 30,
      parcelas: 3,
      competenciaInicio: "2026-11",
    };
    expect(parcelaNaCompetencia(lapis, "2026-11")).toMatchObject({ atual: 1, total: 3, valor: 10 });
    expect(parcelaNaCompetencia(lapis, "2026-12")).toMatchObject({ atual: 2, total: 3 });
    expect(parcelaNaCompetencia(lapis, "2027-01")).toMatchObject({ atual: 3, total: 3 });
    expect(parcelaNaCompetencia(lapis, "2027-02")).toBeNull();
  });

  it("soma a fatura do mês com todas as compras ativas", () => {
    const fatura = faturaDoMes(
      [pc, { nome: "Geladeira", valorTotal: 300, parcelas: 3, competenciaInicio: "2026-10" }],
      "2026-10",
    );
    expect(fatura).toBeCloseTo(200, 2);
  });

  it("compra em 1x não entra em parcelas — só em avulsos da fatura", () => {
    const avulsa = {
      nome: "Mercado Livre",
      valorTotal: 89.9,
      parcelas: 1,
      competenciaInicio: "2026-11",
    };
    expect(parcelasDoMes([pc, avulsa], "2026-11")).toHaveLength(1);
    expect(parcelasDoMes([pc, avulsa], "2026-11")[0]?.nome).toBe("PC");
    expect(avulsosCompraDoMes([avulsa], "2026-11")).toMatchObject([{ nome: "Mercado Livre", total: 1, valor: 89.9 }]);
    expect(faturaParcelasDoMes([pc, avulsa], "2026-11")).toBeCloseTo(100, 2);
    expect(faturaAvulsosCompraDoMes([avulsa], "2026-11")).toBeCloseTo(89.9, 2);
    expect(faturaDoMes([pc, avulsa], "2026-11")).toBeCloseTo(189.9, 2);
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

describe("competenciaDaFatura", () => {
  it("até o dia do fechamento fica no mesmo mês", () => {
    expect(competenciaDaFatura({ ano: 2026, mes: 11, dia: 7 }, 7)).toBe("2026-11");
    expect(competenciaDaFatura({ ano: 2026, mes: 11, dia: 1 }, 7)).toBe("2026-11");
  });
  it("depois do fechamento vai para o mês seguinte", () => {
    expect(competenciaDaFatura({ ano: 2026, mes: 11, dia: 8 }, 7)).toBe("2026-12");
    expect(competenciaDaFatura({ ano: 2026, mes: 12, dia: 20 }, 7)).toBe("2027-01");
  });
});

describe("dataPagamentoDaFatura", () => {
  it("vence no dia de pagamento do próprio mês da fatura", () => {
    // Fecha 7/out → fatura de nov acumula → paga 14/nov
    expect(dataPagamentoDaFatura("2026-11", 14)).toEqual({ ano: 2026, mes: 11, dia: 14 });
    // Fecha 7/nov → fatura de dez → paga 14/dez
    expect(dataPagamentoDaFatura("2026-12", 14)).toEqual({ ano: 2026, mes: 12, dia: 14 });
    // Fecha 7/dez → fatura de jan → paga 14/jan
    expect(dataPagamentoDaFatura("2027-01", 14)).toEqual({ ano: 2027, mes: 1, dia: 14 });
  });
});
