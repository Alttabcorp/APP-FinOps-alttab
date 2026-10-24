import { describe, expect, it } from "vitest";
import {
  abertoEmprestimoMeta,
  devolverParaMeta,
  parcelaDevolucao,
  sacarDaMeta,
  situacaoEmprestimoMeta,
  somarDevolucao,
} from "./emprestimo-meta";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

describe("empréstimo da meta", () => {
  it("tira da meta só o que tem e fica devendo o saque", () => {
    const saque = sacarDaMeta(2500, 800);
    quase(saque.saldo, 1700);
    quase(saque.saque, 800);
    expect(() => sacarDaMeta(100, 100.01)).toThrow(/não tem saldo/i);
    expect(() => sacarDaMeta(100, 0)).toThrow(/valor da compra/i);
  });

  it("devolve aos poucos e a última parcela zera a dívida", () => {
    const primeira = devolverParaMeta(1700, 800, 200);
    quase(primeira.saldo, 1900);
    quase(primeira.aberto, 600);
    const ultima = devolverParaMeta(2300, 200, 200);
    quase(ultima.saldo, 2500);
    quase(ultima.aberto, 0);
    expect(() => devolverParaMeta(1700, 200, 250)).toThrow(/não deve tanto/i);
  });

  it("sugere a parcela do mês e estica se ainda restar dívida", () => {
    const sofa = {
      nome: "Sofá",
      valorTotal: 1200,
      parcelas: 6,
      competenciaInicio: "2026-10",
      pagoTotal: 400,
    };
    quase(abertoEmprestimoMeta(sofa), 800);
    quase(parcelaDevolucao(sofa, "2026-09"), 0);
    quase(parcelaDevolucao(sofa, "2026-10"), 0);
    quase(parcelaDevolucao(sofa, "2026-12"), 200);
    quase(parcelaDevolucao({ ...sofa, pagoTotal: 1100 }, "2027-03"), 100);
    quase(parcelaDevolucao({ ...sofa, pagoTotal: 200 }, "2027-08"), 200);
    quase(
      somarDevolucao(
        [sofa, { ...sofa, nome: "Fogão", valorTotal: 300, parcelas: 3, pagoTotal: 0 }],
        "2026-10",
      ),
      100,
    );
  });

  it("mostra o que ainda falta devolver", () => {
    const situacao = situacaoEmprestimoMeta(
      { nome: "Mesa", valorTotal: 900, parcelas: 3, competenciaInicio: "2026-10", pagoTotal: 300 },
      "2026-11",
    );
    expect(situacao.quitado).toBe(false);
    quase(situacao.aberto, 600);
    quase(situacao.parcelaSugerida, 300);
    expect(situacao.parcelasRestantes).toBe(2);
  });
});
