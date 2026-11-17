import { describe, expect, it } from "vitest";
import { agruparRendas, mapearRendaParaItem, rendasPadrao, somarRendimentoPassivo } from "./renda";

describe("mapearRendaParaItem", () => {
  it("manda salário, bico e venda para o saldo em dinheiro", () => {
    expect(mapearRendaParaItem("EMPREGO")).toEqual({ tipoItem: "SALDO", papel: null });
    expect(mapearRendaParaItem("BICO")).toEqual({ tipoItem: "SALDO", papel: null });
    expect(mapearRendaParaItem("VENDA")).toEqual({ tipoItem: "SALDO", papel: null });
  });

  it("separa VA, VT e rendimento pelo papel do extra", () => {
    expect(mapearRendaParaItem("VALE_ALIMENTACAO").papel).toBe("VALE_ALIMENTACAO");
    expect(mapearRendaParaItem("VALE_TRANSPORTE").papel).toBe("VALE_TRANSPORTE");
    expect(mapearRendaParaItem("RENDIMENTO")).toEqual({ tipoItem: "EXTRA", papel: "PROVENTO_FUNDO" });
    expect(mapearRendaParaItem("RENDIMENTO", "Rendimento da poupança")).toEqual({
      tipoItem: "EXTRA",
      papel: "PROVENTO_POUPANCA",
    });
    expect(mapearRendaParaItem("RENDIMENTO", "Rendimento da meta")).toEqual({
      tipoItem: "EXTRA",
      papel: "PROVENTO_POUPANCA",
    });
  });

  it("abre salário, bico, venda, vales e rendimentos, sem separar cônjuge", () => {
    const nomes = rendasPadrao().map((renda) => renda.nome);
    expect(nomes).toContain("Bicos");
    expect(nomes).toContain("Vendas");
    expect(nomes).toContain("Vale-alimentação");
    expect(nomes).toContain("Rendimento das contas");
    expect(nomes.some((nome) => /esposa/i.test(nome))).toBe(false);
  });

  it("agrupa salário, bico/venda, rendimentos e vales", () => {
    const grupos = agruparRendas(rendasPadrao());
    expect(grupos.map((grupo) => grupo.id)).toEqual(["salario", "pontual", "rendimento", "vale"]);
    expect(grupos[0].itens.map((renda) => renda.nome)).toEqual(["Projeto", "Pesquisa", "HUJB"]);
    expect(grupos[1].itens.map((renda) => renda.nome)).toEqual(["Bicos", "Vendas"]);
    expect(grupos[2].itens.map((renda) => renda.nome)).toEqual([
      "Rendimento das contas",
      "Rendimento da poupança",
      "Rendimento da meta",
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
