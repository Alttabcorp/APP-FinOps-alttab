import type { TipoItem } from "@prisma/client";
import type { ItemDTO } from "@/lib/application/mes-mapper";

export const ehAPagar = (tipo: TipoItem) =>
  tipo === "CONTA" || tipo === "EXTRA_MES" || tipo === "ANUAL";

export const progressoPagamento = (itens: ItemDTO[]) => {
  const contas = itens.filter((item) => ehAPagar(item.tipo));
  const pagas = contas.filter((item) => item.pago);
  const aberto = contas
    .filter((item) => !item.pago)
    .reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
  return { total: contas.length, pagas: pagas.length, aberto };
};

/** Soma dos valores das contas marcadas como pagas (checklist do mês). */
export const totalContasPagas = (itens: ItemDTO[]) =>
  itens
    .filter((item) => ehAPagar(item.tipo) && item.pago)
    .reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

export const temContaComValor = (itens: ItemDTO[]) =>
  itens.some((item) => ehAPagar(item.tipo) && Math.abs(Number(item.valor) || 0) >= 0.005);
