import { describe, expect, it } from "vitest";
import { agruparRendas, mapearRendaParaItem, rendasPadrao, somarRendimentoPassivo } from "./renda";

describe("mapearRendaParaItem", () => {
  it("manda emprego e bico para o saldo em dinheiro", () => {
    expect(mapearRendaParaItem("EMPREGO")).toEqual({ tipoItem: "SALDO", papel: null });
    expect(mapearRendaParaItem("BICO")).toEqual({ tipoItem: "SALDO", papel: null });
  });

  it("separa VA, VT e rendimento pelo papel do extra", () => {
    expect(mapearRendaParaItem("VALE_ALIMENTACAO").papel).toBe("VALE_ALIMENTACAO");
    expect(mapearRendaParaItem("VALE_TRANSPORTE").papel).toBe("VALE_TRANSPORTE");
    expect(mapearRendaParaItem("RENDIMENTO")).toEqual({ tipoItem: "EXTRA", papel: "PROVENTO_FUNDO" });
    expect(mapearRendaParaItem("RENDIMENTO", "Rendimento da poupança")).toEqual({
      tipoItem: "EXTRA",
      papel: "PROVENTO_POUPANCA",
    });
  });

  it("abre entradas, vales e o rendimento das contas, sem separar cônjuge", () => {
    const nomes = rendasPadrao().map((renda) => renda.nome);
    expect(nomes).toContain("Bicos");
    expect(nomes).toContain("Vale-alimentação");
    expect(nomes).toContain("Rendimento das contas");
    expect(nomes.some((nome) => /esposa/i.test(nome))).toBe(false);
  });

  it("agrupa entradas e rendimentos sem titular", () => {
    const grupos = agruparRendas(rendasPadrao());
    expect(grupos.map((grupo) => grupo.id)).toEqual(["entrada", "rendimento", "vale"]);
    expect(grupos[0].itens.map((renda) => renda.nome)).toEqual(["Projeto", "Pesquisa", "HUJB", "Bicos"]);
    expect(grupos[1].itens.map((renda) => renda.nome)).toEqual([
      "Rendimento das contas",
      "Rendimento da poupança",
    ]);
  });

  it("soma só o rendimento passivo", () => {
    expect(
      somarRendimentoPassivo([
        { papel: "PROVENTO_FUNDO", valor: 40 },
        { papel: "VALE_TRANSPORTE", valor: 80 },
        { papel: "PROVENTO_FUNDO", valor: 10 },
        { papel: "PROVENTO_POUPANCA", valor: 12 },
      ]),
    ).toBeCloseTo(62, 2);
  });
});
