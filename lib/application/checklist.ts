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
