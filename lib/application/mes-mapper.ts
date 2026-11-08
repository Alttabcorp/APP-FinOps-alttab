import type { ItemFinanceiro as ItemPrisma, MesFinanceiro, PapelExtra, TipoItem } from "@prisma/client";
import { calcularMes } from "@/lib/domain/financeiro/calcular-mes";
import type { CampoMarca } from "@/lib/domain/financeiro/transferencia";
import type { EntradaMes, ItemFinanceiro, ResultadoMes } from "@/lib/domain/financeiro/tipos";

export type MesComItens = MesFinanceiro & { itens: ItemPrisma[] };

export type ItemDTO = {
  id?: string;
  tipo: TipoItem;
  nome: string;
  valor: number;
  papel?: PapelExtra | null;
  ordem: number;
  pago: boolean;
  fonteRendaId?: string | null;
  contaAnualId?: string | null;
};

export type MesDTO = {
  competencia: string;
  itens: ItemDTO[];
  feiraReal: number;
  cartaoReal: number;
  gasolinaReal: number;
  fundoReal: number;
  alttabReal: number;
  poupancaReal: number;
  reservaReal: number;
  metaReal: number;
  poupancaEditado: boolean;
  fundoEditado: boolean;
  alttabEditado: boolean;
  reservaEditado: boolean;
  metaEditado: boolean;
  fechado: boolean;
  fechadoEm: string | null;
  depositos: Record<CampoMarca, boolean>;
  sobraAnteriorConfirmada: boolean;
};

const decimalParaNumero = (valor: { toString(): string } | number) => Number(valor);

export const mesParaEntrada = (mes: MesComItens): EntradaMes => {
  const porTipo = (tipo: TipoItem): ItemFinanceiro[] =>
    mes.itens
      .filter((item) => item.tipo === tipo)
      .map((item) => ({
        nome: item.nome,
        valor: decimalParaNumero(item.valor),
        papel: item.papel,
      }));

  return {
    saldo: porTipo("SALDO"),
    extra: porTipo("EXTRA"),
    contas: porTipo("CONTA"),
    extraMes: porTipo("EXTRA_MES"),
    anuais: porTipo("ANUAL"),
    despesasVariaveis: {
      feira: decimalParaNumero(mes.feiraReal),
      cartao: decimalParaNumero(mes.cartaoReal),
      gasolina: decimalParaNumero(mes.gasolinaReal),
    },
    investimentos: {
      fundo: decimalParaNumero(mes.fundoReal),
      alttab: decimalParaNumero(mes.alttabReal),
      poupanca: decimalParaNumero(mes.poupancaReal),
      reserva: decimalParaNumero(mes.reservaReal),
      meta: decimalParaNumero(mes.metaReal),
      poupancaEditado: mes.poupancaEditado,
      fundoEditado: mes.fundoEditado,
      alttabEditado: mes.alttabEditado,
      reservaEditado: mes.reservaEditado,
      metaEditado: mes.metaEditado,
    },
  };
};

export const mesParaDto = (mes: MesComItens): MesDTO => ({
  competencia: mes.competencia,
  itens: mes.itens.map((item) => ({
    id: item.id,
    tipo: item.tipo,
    nome: item.nome,
    valor: decimalParaNumero(item.valor),
    papel: item.papel,
    ordem: item.ordem,
    pago: item.tipo === "CONTA" || item.tipo === "EXTRA_MES" || item.tipo === "ANUAL" ? item.pago : false,
    fonteRendaId: item.fonteRendaId,
    contaAnualId: item.contaAnualId,
  })),
  feiraReal: decimalParaNumero(mes.feiraReal),
  cartaoReal: decimalParaNumero(mes.cartaoReal),
  gasolinaReal: decimalParaNumero(mes.gasolinaReal),
  fundoReal: decimalParaNumero(mes.fundoReal),
  alttabReal: decimalParaNumero(mes.alttabReal),
  poupancaReal: decimalParaNumero(mes.poupancaReal),
  reservaReal: decimalParaNumero(mes.reservaReal),
  metaReal: decimalParaNumero(mes.metaReal),
  poupancaEditado: mes.poupancaEditado,
  fundoEditado: mes.fundoEditado,
  alttabEditado: mes.alttabEditado,
  reservaEditado: mes.reservaEditado,
  metaEditado: mes.metaEditado,
  fechado: mes.fechado,
  fechadoEm: mes.fechadoEm ? mes.fechadoEm.toISOString() : null,
  sobraAnteriorConfirmada: Boolean(mes.sobraAnteriorConfirmada),
  depositos: {
    poupanca: Boolean(mes.poupancaDepositado),
    reserva: Boolean(mes.reservaDepositado),
    fundo: Boolean(mes.fundoDepositado),
    alttab: Boolean(mes.alttabDepositado),
    meta: Boolean(mes.metaDepositado),
    cartao: Boolean(mes.cartaoPago),
  },
});

export const calcularMesPersistido = (
  mes: MesComItens,
  cartaoFatura = 0,
  gastoPessoalAlvo: number | null = null,
  reposicaoMeta = 0,
  cartaoFixo = 0,
): ResultadoMes => {
  const entrada = mesParaEntrada(mes);
  entrada.cartaoParcelas = cartaoFatura;
  entrada.cartaoFixo = cartaoFixo;
  entrada.gastoPessoalAlvo = gastoPessoalAlvo;
  entrada.reposicaoMeta = reposicaoMeta;
  return calcularMes(entrada);
};
