import { describe, expect, it } from "vitest";
import {
  chaveDiaSaoPaulo,
  resumoLancamentosHoje,
  somarLancamentos,
  type LancamentoDTO,
} from "./lancamento-service";

const item = (parcial: Partial<LancamentoDTO> & Pick<LancamentoDTO, "id" | "data" | "valor">): LancamentoDTO => ({
  competencia: "2026-11",
  categoria: "feira",
  descricao: "Mercado",
  ...parcial,
});

describe("resumo de lançamentos", () => {
  it("soma valores da lista", () => {
    expect(
      somarLancamentos([
        item({ id: "1", data: "2026-11-24T12:00:00.000Z", valor: 10 }),
        item({ id: "2", data: "2026-11-24T13:00:00.000Z", valor: 5.5 }),
      ]),
    ).toBeCloseTo(15.5, 2);
  });

  it("conta só lançamentos do dia de hoje em São Paulo", () => {
    // 24/11/2026 15:00 UTC = 12:00 em SP
    const agora = new Date("2026-11-24T15:00:00.000Z");
    expect(chaveDiaSaoPaulo(agora)).toBe("2026-11-24");
    const resumo = resumoLancamentosHoje(
      [
        item({ id: "1", data: "2026-11-24T14:00:00.000Z", valor: 20 }),
        item({ id: "2", data: "2026-11-24T18:00:00.000Z", valor: 30 }),
        item({ id: "3", data: "2026-11-23T18:00:00.000Z", valor: 99 }),
      ],
      agora,
    );
    expect(resumo.vezes).toBe(2);
    expect(resumo.total).toBeCloseTo(50, 2);
  });
});
