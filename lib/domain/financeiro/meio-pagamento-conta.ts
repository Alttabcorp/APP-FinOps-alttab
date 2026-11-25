export const MEIOS_PAGAMENTO_CONTA = ["DINHEIRO", "CARTAO", "VALE"] as const;
export type MeioPagamentoConta = (typeof MEIOS_PAGAMENTO_CONTA)[number];

export const ROTULOS_MEIO_PAGAMENTO_CONTA: Record<MeioPagamentoConta, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
  VALE: "Vale-alimentação",
};

export const isMeioPagamentoConta = (valor: unknown): valor is MeioPagamentoConta =>
  typeof valor === "string" && (MEIOS_PAGAMENTO_CONTA as readonly string[]).includes(valor);

/** Ao marcar pago, exige um meio; ao desmarcar, limpa. */
export const meioAoMarcarPago = (pago: boolean, meio: MeioPagamentoConta | null | undefined) =>
  pago ? (meio && isMeioPagamentoConta(meio) ? meio : null) : null;
