import { describe, expect, it } from "vitest";
import {
  aplicarValoresDoMesAnterior,
  clonarItensParaNovoMes,
  tiposCopiaValidos,
  TIPOS_COPIA_PADRAO,
  type ItemClonavel,
} from "./copiar-mes";

const item = (parcial: Partial<ItemClonavel> & Pick<ItemClonavel, "tipo" | "nome">): ItemClonavel => ({
  valor: 0,
  ordem: 0,
  pago: false,
  papel: null,
  ...parcial,
});

describe("clonarItensParaNovoMes", () => {
  const origem: ItemClonavel[] = [
    item({ tipo: "SALDO", nome: "Projeto", valor: 2500, ordem: 0 }),
    item({ tipo: "EXTRA", nome: "Vale-transporte", valor: 120, papel: "VALE_TRANSPORTE", ordem: 1 }),
    item({ tipo: "CONTA", nome: "Energia", valor: 80, pago: true, ordem: 2 }),
    item({ tipo: "EXTRA_MES", nome: "Gás", valor: 110, ordem: 3 }),
  ];

  it("copia só contas, no padrão de abrir o mês pela url", () => {
    const clonados = clonarItensParaNovoMes(origem);
    expect(clonados.map((linha) => linha.valor)).toEqual([0, 0, 80, 0]);
    expect(clonados.map((linha) => linha.tipo)).toEqual(["SALDO", "EXTRA", "CONTA", "EXTRA_MES"]);
    expect(clonados.every((linha) => linha.pago === false)).toBe(true);
    expect(clonados[1]?.papel).toBe("VALE_TRANSPORTE");
  });

  it("não leva conta anual para o mês seguinte", () => {
    const clonados = clonarItensParaNovoMes([
      ...origem,
      item({ tipo: "ANUAL", nome: "IPTU 10/10", valor: 120, contaAnualId: "iptu", ordem: 4 }),
    ]);
    expect(clonados.some((linha) => linha.tipo === "ANUAL")).toBe(false);
  });

  it("traz saldo, extra e contas quando a pessoa escolhe o padrão do próximo mês", () => {
    const clonados = clonarItensParaNovoMes(origem, TIPOS_COPIA_PADRAO);
    expect(clonados.map((linha) => linha.valor)).toEqual([2500, 120, 80, 0]);
  });
});

describe("aplicarValoresDoMesAnterior", () => {
  it("casa pelo nome, ignora maiúscula e acrescenta linha que faltava", () => {
    const destino: ItemClonavel[] = [
      item({ tipo: "SALDO", nome: "projeto", valor: 0, ordem: 0 }),
      item({ tipo: "SALDO", nome: "HUJB", valor: 10, ordem: 1 }),
      item({ tipo: "CONTA", nome: "Energia", valor: 40, ordem: 2 }),
    ];
    const origem: ItemClonavel[] = [
      item({ tipo: "SALDO", nome: "Projeto", valor: 2500, ordem: 0 }),
      item({ tipo: "SALDO", nome: "Pesquisa", valor: 800, ordem: 1 }),
      item({ tipo: "CONTA", nome: "Energia", valor: 90, ordem: 2 }),
    ];

    const resultado = aplicarValoresDoMesAnterior(destino, origem, ["SALDO"]);
    const saldos = resultado.filter((linha) => linha.tipo === "SALDO");
    expect(saldos.map((linha) => [linha.nome, linha.valor])).toEqual([
      ["projeto", 2500],
      ["HUJB", 10],
      ["Pesquisa", 800],
    ]);
    expect(resultado.find((linha) => linha.tipo === "CONTA")?.valor).toBe(40);
  });

  it("não mexe em nada se nenhum grupo foi marcado", () => {
    const destino = [item({ tipo: "SALDO", nome: "Projeto", valor: 1 })];
    expect(aplicarValoresDoMesAnterior(destino, [item({ tipo: "SALDO", nome: "Projeto", valor: 9 })], [])).toEqual(
      destino,
    );
  });
});

describe("tiposCopiaValidos", () => {
  it("descarta tipo desconhecido e cai no padrão se a lista não vier", () => {
    expect(tiposCopiaValidos(["SALDO", "HACK", "EXTRA"])).toEqual(["SALDO", "EXTRA"]);
    expect(tiposCopiaValidos(null)).toEqual(TIPOS_COPIA_PADRAO);
  });
});
