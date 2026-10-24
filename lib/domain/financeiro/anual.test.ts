import { describe, expect, it } from "vitest";
import {
  contasAnuaisDoMes,
  formatarDataCobranca,
  formatarPeriodoAnual,
  mesInicioParcelaAnual,
  mesesAteCobranca,
  parcelaAnualNaCompetencia,
  valorParcelaAnual,
  type ContaAnualEntrada,
} from "./anual";

const iptu = (): ContaAnualEntrada => ({
  nome: "IPTU",
  valor: 1200,
  dia: 10,
  mes: 10,
  parcelas: 10,
  lado: "CASA",
});

const ipva = (): ContaAnualEntrada => ({
  nome: "IPVA",
  valor: 890,
  dia: 15,
  mes: 1,
  parcelas: 1,
  lado: "CASA",
});

const dominio = (): ContaAnualEntrada => ({
  nome: "Domínio do site",
  valor: 80,
  dia: 5,
  mes: 3,
  parcelas: 1,
  lado: "EMPRESA",
});

describe("parcelaAnualNaCompetencia", () => {
  it("repete o IPVA em janeiro de qualquer ano", () => {
    expect(parcelaAnualNaCompetencia(ipva(), "2026-01")?.valor).toBeCloseTo(890, 2);
    expect(parcelaAnualNaCompetencia(ipva(), "2026-01")?.dia).toBe(15);
    expect(parcelaAnualNaCompetencia(ipva(), "2026-02")).toBeNull();
    expect(parcelaAnualNaCompetencia(ipva(), "2027-01")?.nome).toBe("IPVA");
  });

  it("parcela o IPTU até o mês da cobrança e some depois", () => {
    const outubro = parcelaAnualNaCompetencia(iptu(), "2026-10");
    expect(outubro).toMatchObject({ atual: 10, total: 10, nome: "IPTU 10/10", dia: 10 });
    expect(outubro?.valor).toBeCloseTo(120, 2);
    expect(parcelaAnualNaCompetencia(iptu(), "2026-11")).toBeNull();
    expect(parcelaAnualNaCompetencia(iptu(), "2026-01")?.nome).toBe("IPTU 1/10");
    expect(parcelaAnualNaCompetencia(iptu(), "2027-01")?.nome).toBe("IPTU 1/10");
  });

  it("cobra o domínio todo março", () => {
    expect(parcelaAnualNaCompetencia(dominio(), "2026-03")?.valor).toBeCloseTo(80, 2);
    expect(parcelaAnualNaCompetencia(dominio(), "2026-04")).toBeNull();
    expect(parcelaAnualNaCompetencia(dominio(), "2027-03")?.nome).toBe("Domínio do site");
  });

  it("atravessa o ano quando a cobrança é no começo do calendário", () => {
    const maquina: ContaAnualEntrada = {
      nome: "Máquina virtual",
      valor: 300,
      dia: 20,
      mes: 1,
      parcelas: 3,
      lado: "EMPRESA",
    };
    expect(parcelaAnualNaCompetencia(maquina, "2026-11")?.atual).toBe(1);
    expect(parcelaAnualNaCompetencia(maquina, "2026-12")?.atual).toBe(2);
    expect(parcelaAnualNaCompetencia(maquina, "2027-01")?.atual).toBe(3);
    expect(parcelaAnualNaCompetencia(maquina, "2026-10")).toBeNull();
    expect(parcelaAnualNaCompetencia(maquina, "2027-02")).toBeNull();
  });
});

describe("contasAnuaisDoMes", () => {
  it("junta só o que cai na competência", () => {
    const nomes = contasAnuaisDoMes([iptu(), ipva(), dominio()], "2026-01").map((item) => item.nome);
    expect(nomes).toEqual(["IPTU 1/10", "IPVA"]);
  });
});

describe("valorParcelaAnual", () => {
  it("deixa o resto na última parcela", () => {
    expect(valorParcelaAnual(1000, 3, 0)).toBeCloseTo(333.33, 2);
    expect(valorParcelaAnual(1000, 3, 1)).toBeCloseTo(333.33, 2);
    expect(valorParcelaAnual(1000, 3, 2)).toBeCloseTo(333.34, 2);
  });
});

describe("mesesAteCobranca", () => {
  it("conta o mês atual até o mês da cobrança", () => {
    expect(mesesAteCobranca("2026-04", 10)).toBe(7);
    expect(mesesAteCobranca("2026-10", 10)).toBe(1);
    expect(mesesAteCobranca("2026-11", 10)).toBe(12);
  });
});

describe("mesInicioParcelaAnual", () => {
  it("começa as parcelas de modo que a última caia na cobrança", () => {
    expect(mesInicioParcelaAnual(10, 10)).toBe(1);
    expect(mesInicioParcelaAnual(10, 7)).toBe(4);
    expect(mesInicioParcelaAnual(1, 3)).toBe(11);
    expect(mesInicioParcelaAnual(1, 1)).toBe(1);
  });
});

describe("formatarDataCobranca", () => {
  it("junta dia e mês", () => {
    expect(formatarDataCobranca(10, 10)).toBe("dia 10 de outubro");
    expect(formatarDataCobranca(1, 1)).toBe("dia 1 de janeiro");
  });
});

describe("formatarPeriodoAnual", () => {
  it("diz a cobrança e o intervalo das parcelas", () => {
    expect(formatarPeriodoAnual(1, 1, 15)).toBe("Cobra todo dia 15 de janeiro");
    expect(formatarPeriodoAnual(10, 10, 10)).toBe("10x de janeiro até dia 10 de outubro");
    expect(formatarPeriodoAnual(3, 12, 5)).toBe("Todo mês · cobra dia 5 de março");
  });
});
