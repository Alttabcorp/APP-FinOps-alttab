import { describe, expect, it } from "vitest";
import { calcularMes } from "./calcular-mes";
import {
  linhasDepositoInvestimento,
  montarRoteiroTransferencia,
  type DestinosTransferencia,
} from "./transferencia";
import type { ContaDestinoPix } from "./transferencia";

const quase = (obtido: number, esperado: number) => {
  expect(obtido).toBeCloseTo(esperado, 2);
};

const contas: ContaDestinoPix[] = [
  {
    id: "reserva",
    nome: "PicPay Glaymar",
    finalidade: "RESERVA",
    banco: "PicPay",
    titular: "Glaymar",
    chavePix: "glaymar@picpay",
    recebePoupanca: true,
  },
  {
    id: "fundo",
    nome: "Nubank Glaymar",
    finalidade: "INVESTIMENTO",
    banco: "Nubank",
    chavePix: "glaymar@nubank",
  },
  {
    id: "empresa",
    nome: "Caixinha Alttabcorp",
    finalidade: "EMPRESA",
    banco: "Nubank",
    chavePix: "alttab@nubank",
  },
  {
    id: "meta",
    nome: "PicPay Ayrle",
    finalidade: "META",
    banco: "PicPay",
    chavePix: "ayrle@picpay",
  },
];

const destinos = (parcial: Partial<DestinosTransferencia> = {}): DestinosTransferencia => ({
  contas,
  anuais: [],
  destinoCartao: { nome: "Nubank Ayrle", chavePix: "ayrle@nubank" },
  ...parcial,
});

describe("roteiro de transferência", () => {
  it("aponta a fatura do cartão para a chave da conta, não do QR da fatura", () => {
    const resultado = calcularMes({
      saldo: [{ nome: "Salário", valor: 5000 }],
      despesasVariaveis: { feira: 0, cartao: 80, gasolina: 0 },
      cartaoFixo: 200,
      cartaoParcelas: 100,
    });
    const cartao = montarRoteiroTransferencia(resultado, destinos()).find((linha) => linha.id === "cartao");
    quase(cartao?.valor ?? 0, 380);
    expect(cartao?.destino).toBe("Nubank Ayrle");
    expect(cartao?.chavePix).toBe("ayrle@nubank");
  });

  it("manda os 10% da poupança para a conta marcada, mesmo sendo reserva", () => {
    const resultado = calcularMes({
      saldo: [{ nome: "Salário", valor: 4000 }],
    });
    const poupanca = montarRoteiroTransferencia(resultado, destinos()).find((linha) => linha.id === "poupanca");
    quase(poupanca?.valor ?? 0, 400);
    expect(poupanca?.destino).toBe("PicPay Glaymar");
    expect(poupanca?.chavePix).toBe("glaymar@picpay");
  });

  it("usa a sugestão do fundo e da Alttab quando o real ainda não foi informado", () => {
    const resultado = calcularMes({
      saldo: [{ nome: "Salário", valor: 4000 }],
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: false },
    });
    const linhas = montarRoteiroTransferencia(resultado, destinos());
    quase(linhas.find((linha) => linha.id === "fundo")?.valor ?? 0, 50);
    quase(linhas.find((linha) => linha.id === "alttab")?.valor ?? 0, 100);
    expect(linhas.find((linha) => linha.id === "fundo")?.destino).toBe("Nubank Glaymar");
    expect(linhas.find((linha) => linha.id === "alttab")?.destino).toBe("Caixinha Alttabcorp");
  });

  it("usa o real do fundo quando já foi informado", () => {
    const resultado = calcularMes({
      saldo: [{ nome: "Salário", valor: 4000 }],
      investimentos: { fundo: 70, alttab: 100, poupanca: 400, poupancaEditado: true },
    });
    quase(montarRoteiroTransferencia(resultado, destinos()).find((linha) => linha.id === "fundo")?.valor ?? 0, 70);
  });

  it("inclui cada anual deste mês com a própria chave", () => {
    const resultado = calcularMes({
      saldo: [{ nome: "Salário", valor: 4000 }],
    });
    const iptu = montarRoteiroTransferencia(
      resultado,
      destinos({
        anuais: [{ id: "iptu", nome: "IPTU", valor: 180, banco: "Nubank", chavePix: "caixinha-iptu" }],
      }),
    ).find((linha) => linha.id === "anual:iptu");
    quase(iptu?.valor ?? 0, 180);
    expect(iptu?.destino).toBe("IPTU");
    expect(iptu?.chavePix).toBe("caixinha-iptu");
  });

  it("aponta a sobra da meta para a conta META", () => {
    const resultado = calcularMes({
      saldo: [{ nome: "Salário", valor: 4000 }],
    });
    const meta = montarRoteiroTransferencia(resultado, destinos()).find((linha) => linha.id === "meta");
    expect(meta?.destino).toBe("PicPay Ayrle");
    expect(meta && meta.valor > 0.005).toBe(true);
    quase(meta?.valor ?? 0, resultado.distribuicao.metaFinal);
  });

  it("omite linhas zeradas e ainda mostra o destino sem chave", () => {
    const resultado = calcularMes({
      saldo: [{ nome: "Salário", valor: 2000 }],
      investimentos: { fundo: 0, alttab: 0, poupanca: 0, poupancaEditado: true },
    });
    const linhas = montarRoteiroTransferencia(
      resultado,
      destinos({
        destinoCartao: { nome: "Nubank Ayrle", chavePix: "" },
        anuais: [{ id: "ipva", nome: "IPVA", valor: 0, chavePix: "x" }],
      }),
    );
    expect(linhas.find((linha) => linha.id === "cartao")).toBeUndefined();
    expect(linhas.find((linha) => linha.id === "poupanca")).toBeUndefined();
    expect(linhas.find((linha) => linha.id === "anual:ipva")).toBeUndefined();
    expect(linhas.find((linha) => linha.id === "alttab")?.chavePix).toBe("alttab@nubank");
    expect(linhas.find((linha) => linha.id === "fundo")?.valor).toBeCloseTo(50, 2);
  });

  it("separa só os depósitos de investimento para o checklist", () => {
    const resultado = calcularMes({
      saldo: [{ nome: "Salário", valor: 4000 }],
      despesasVariaveis: { feira: 0, cartao: 80, gasolina: 0 },
      cartaoFixo: 200,
      cartaoParcelas: 0,
    });
    const ids = linhasDepositoInvestimento(montarRoteiroTransferencia(resultado, destinos())).map(
      (linha) => linha.id,
    );
    expect(ids).toEqual(["poupanca", "fundo", "alttab", "meta"]);
    expect(ids.includes("cartao")).toBe(false);
  });
});
