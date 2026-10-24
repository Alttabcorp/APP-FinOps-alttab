import { describe, expect, it } from "vitest";
import {
  avisoSaque,
  calcularProgressoMeta,
  contaPodeSacar,
  contasPadrao,
  isFinalidadeConta,
  somarSaldos,
} from "./conta";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

describe("calcularProgressoMeta", () => {
  it("mostra 25% e o que falta para juntar 10 mil", () => {
    const r = calcularProgressoMeta(2500, 10000);
    expect(r.temMeta).toBe(true);
    quase(r.percentual, 25);
    quase(r.percentualBarra, 25);
    quase(r.falta, 7500);
    expect(r.atingida).toBe(false);
    quase(r.excedente, 0);
  });

  it("marca a meta como atingida no valor cheio", () => {
    const r = calcularProgressoMeta(10000, 10000);
    expect(r.atingida).toBe(true);
    quase(r.percentualBarra, 100);
    quase(r.falta, 0);
  });

  it("guarda o excedente quando o saldo passa da meta", () => {
    const r = calcularProgressoMeta(11250, 10000);
    expect(r.atingida).toBe(true);
    quase(r.percentual, 112.5);
    quase(r.percentualBarra, 100);
    quase(r.excedente, 1250);
  });

  it("não calcula progresso sem objetivo", () => {
    expect(calcularProgressoMeta(800, null).temMeta).toBe(false);
    expect(calcularProgressoMeta(800, 0).temMeta).toBe(false);
    expect(calcularProgressoMeta(800, -10).temMeta).toBe(false);
  });
});

describe("contasPadrao", () => {
  it("abre as cinco contas da casa com os objetivos certos", () => {
    const contas = contasPadrao();
    expect(contas.map((conta) => conta.finalidade)).toEqual([
      "POUPANCA",
      "RESERVA",
      "META",
      "INVESTIMENTO",
      "EMPRESA",
    ]);
    const meta = contas.find((conta) => conta.finalidade === "META");
    quase(meta?.meta ?? 0, 10000);
    quase(contas.find((conta) => conta.finalidade === "INVESTIMENTO")?.metaMensal ?? 0, 1000);
    quase(contas.find((conta) => conta.finalidade === "EMPRESA")?.metaMensal ?? 0, 100);
  });

  it("reconhece finalidade e soma saldos", () => {
    expect(isFinalidadeConta("POUPANCA")).toBe(true);
    expect(isFinalidadeConta("RESERVA")).toBe(true);
    expect(isFinalidadeConta("CORRENTE")).toBe(false);
    expect(contaPodeSacar("POUPANCA")).toBe(true);
    expect(contaPodeSacar("INVESTIMENTO")).toBe(false);
    expect(contaPodeSacar("EMPRESA")).toBe(false);
    expect(avisoSaque("INVESTIMENTO")).toMatch(/não sai/i);
    expect(avisoSaque("EMPRESA")).toMatch(/gasto da empresa/i);
    expect(avisoSaque("META")).toBeNull();
    quase(somarSaldos([{ saldo: 10.5 }, { saldo: 20 }]), 30.5);
  });
});
