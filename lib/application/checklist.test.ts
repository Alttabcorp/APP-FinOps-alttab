import { describe, expect, it } from "vitest";
import { ehAPagar, ehContaRecorrente } from "./checklist";

describe("checklist", () => {
  it("ehAPagar inclui contas, extras do mês e anuais", () => {
    expect(ehAPagar("CONTA")).toBe(true);
    expect(ehAPagar("EXTRA_MES")).toBe(true);
    expect(ehAPagar("ANUAL")).toBe(true);
    expect(ehAPagar("SALDO")).toBe(false);
  });

  it("ehContaRecorrente é só CONTA", () => {
    expect(ehContaRecorrente("CONTA")).toBe(true);
    expect(ehContaRecorrente("EXTRA_MES")).toBe(false);
    expect(ehContaRecorrente("ANUAL")).toBe(false);
    expect(ehContaRecorrente("SALDO")).toBe(false);
  });
});
