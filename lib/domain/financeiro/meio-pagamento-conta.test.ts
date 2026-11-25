import { describe, expect, it } from "vitest";
import { isMeioPagamentoConta, meioAoMarcarPago } from "./meio-pagamento-conta";

describe("meio de pagamento da conta", () => {
  it("aceita só dinheiro, cartão e vale", () => {
    expect(isMeioPagamentoConta("DINHEIRO")).toBe(true);
    expect(isMeioPagamentoConta("CARTAO")).toBe(true);
    expect(isMeioPagamentoConta("VALE")).toBe(true);
    expect(isMeioPagamentoConta("pix")).toBe(false);
  });

  it("ao desmarcar limpa o meio; ao marcar exige meio válido", () => {
    expect(meioAoMarcarPago(false, "CARTAO")).toBeNull();
    expect(meioAoMarcarPago(true, "VALE")).toBe("VALE");
    expect(meioAoMarcarPago(true, null)).toBeNull();
  });
});
