export const ABAS_GASTOS = ["fixas", "extra", "dia", "aportes"] as const;
export type AbaGastos = (typeof ABAS_GASTOS)[number];

export const isAbaGastos = (valor: unknown): valor is AbaGastos =>
  typeof valor === "string" && (ABAS_GASTOS as readonly string[]).includes(valor);

export const ABAS_CARTAO = ["avulsos", "parcelas", "fixos", "pagamento"] as const;
export type AbaCartao = (typeof ABAS_CARTAO)[number];

export const isAbaCartao = (valor: unknown): valor is AbaCartao =>
  typeof valor === "string" && (ABAS_CARTAO as readonly string[]).includes(valor);

/** Sub-abas de Gastos → Dia a dia. */
export const TEMAS_DIA = ["feira", "gasolina", "cartao"] as const;
export type TemaDia = (typeof TEMAS_DIA)[number];

export const isTemaDia = (valor: unknown): valor is TemaDia =>
  typeof valor === "string" && (TEMAS_DIA as readonly string[]).includes(valor);
