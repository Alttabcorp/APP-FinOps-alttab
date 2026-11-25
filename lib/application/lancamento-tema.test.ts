import { describe, expect, it } from "vitest";
import {
  descricaoComPrefixo,
  detalheDescricaoLancamento,
  ehLancamentoDoTema,
  meioPagamentoLancamento,
  resumoTemaNoMes,
  type LancamentoDTO,
} from "./lancamento-service";

const item = (parcial: Partial<LancamentoDTO> & Pick<LancamentoDTO, "id" | "data" | "valor">): LancamentoDTO => ({
  competencia: "2026-11",
  categoria: "feira",
  descricao: "Mercado",
  ...parcial,
});

describe("tema feira/gasolina (dinheiro + vale + cartão)", () => {
  it("classifica meio pelo prefixo e categoria", () => {
    expect(meioPagamentoLancamento(item({ id: "1", data: "2026-11-10T12:00:00.000Z", valor: 10 }))).toBe(
      "dinheiro",
    );
    expect(
      meioPagamentoLancamento(
        item({ id: "2", data: "2026-11-10T12:00:00.000Z", valor: 10, descricao: "Vale · Extra" }),
      ),
    ).toBe("vale");
    expect(
      meioPagamentoLancamento(
        item({
          id: "3",
          data: "2026-11-10T12:00:00.000Z",
          valor: 10,
          categoria: "cartao",
          descricao: "Feira · Extra",
        }),
      ),
    ).toBe("cartao");
  });

  it("reconhece feira no cartão pelo prefixo", () => {
    expect(
      ehLancamentoDoTema(
        item({
          id: "1",
          data: "2026-11-10T12:00:00.000Z",
          valor: 20,
          categoria: "cartao",
          descricao: "Feira · Mercado",
          competencia: "2026-12",
        }),
        "feira",
      ),
    ).toBe(true);
    expect(
      ehLancamentoDoTema(
        item({
          id: "2",
          data: "2026-11-10T12:00:00.000Z",
          valor: 20,
          categoria: "cartao",
          descricao: "Avulso",
        }),
        "feira",
      ),
    ).toBe(false);
  });

  it("soma mercado do mês civil em todos os meios", () => {
    const resumo = resumoTemaNoMes(
      [
        item({ id: "1", data: "2026-11-05T15:00:00.000Z", valor: 40, descricao: "Extra" }),
        item({
          id: "2",
          data: "2026-11-08T15:00:00.000Z",
          valor: 50,
          descricao: "Vale · Extra",
        }),
        item({
          id: "3",
          data: "2026-11-20T15:00:00.000Z",
          valor: 60,
          categoria: "cartao",
          descricao: "Feira · Extra",
          competencia: "2026-12",
        }),
        item({
          id: "4",
          data: "2026-10-30T15:00:00.000Z",
          valor: 99,
          categoria: "cartao",
          descricao: "Feira · Outro mês",
        }),
        item({
          id: "5",
          data: "2026-11-12T15:00:00.000Z",
          valor: 30,
          categoria: "gasolina",
          descricao: "Posto",
        }),
      ],
      "feira",
      "2026-11",
    );
    expect(resumo.total).toBeCloseTo(150, 2);
    expect(resumo.porMeio).toEqual({ dinheiro: 40, vale: 50, cartao: 60 });
    expect(resumo.itens).toHaveLength(3);
  });

  it("monta e limpa prefixos na descrição", () => {
    expect(descricaoComPrefixo("Vale", "Mercado")).toBe("Vale · Mercado");
    expect(descricaoComPrefixo("Feira", "")).toBe("Feira");
    expect(
      detalheDescricaoLancamento(
        item({ id: "1", data: "2026-11-01T12:00:00.000Z", valor: 1, descricao: "Vale · Mercado" }),
      ),
    ).toBe("Mercado");
  });
});
