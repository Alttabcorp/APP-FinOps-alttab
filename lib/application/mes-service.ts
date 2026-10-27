import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { progressoPagamento } from "@/lib/application/checklist";
import { calcularMesPersistido, mesParaDto, type MesComItens, type MesDTO } from "@/lib/application/mes-mapper";
import { avancarCompetencia, isCompetencia } from "@/lib/domain/financeiro/competencia";
import {
  aplicarValoresDoMesAnterior,
  clonarItensParaNovoMes,
  tiposCopiaValidos,
  TIPOS_COPIA_PADRAO,
  type ItemClonavel,
} from "@/lib/domain/financeiro/copiar-mes";
import { listarComprasCartao, listarRecorrentesCartao } from "@/lib/application/cartao-service";
import { listarEmprestimosMeta } from "@/lib/application/emprestimo-meta-service";
import { somarDevolucao } from "@/lib/domain/financeiro/emprestimo-meta";
import { sincronizarContasAnuaisDoMes } from "@/lib/application/anual-service";
import { obterPreferenciaCasa, sincronizarRendasDoMes } from "@/lib/application/renda-service";
import { faturaDoMes, somarRecorrentes } from "@/lib/domain/financeiro/cartao";
import { itensPadrao } from "@/lib/domain/financeiro/padroes";
import type { TipoItem } from "@/lib/domain/financeiro/tipos";

const incluirItens = { itens: { orderBy: { ordem: "asc" as const } } };

const ERRO_MES_FECHADO = "Este mês está fechado. Reabra para editar.";

const mesVazio = (competencia: string): Prisma.MesFinanceiroCreateInput => ({
  competencia,
  alttabReal: 100,
  itens: {
    create: itensPadrao().map((item, ordem) => ({
      tipo: item.tipo,
      nome: item.nome,
      valor: item.valor,
      papel: item.papel ?? null,
      ordem,
    })),
  },
});

const itemParaCreate = (item: ItemClonavel, ordem: number): Prisma.ItemFinanceiroCreateWithoutMesInput => ({
  tipo: item.tipo,
  nome: item.nome,
  valor: item.valor,
  papel: item.papel ?? null,
  ordem: item.ordem ?? ordem,
  pago: false,
  ...(item.fonteRendaId ? { fonteRenda: { connect: { id: item.fonteRendaId } } } : {}),
});

const clonarMes = (
  origem: MesComItens,
  competencia: string,
  copiarValoresDe: TipoItem[],
): Prisma.MesFinanceiroCreateInput => ({
  competencia,
  alttabReal: 100,
  itens: {
    create: clonarItensParaNovoMes(
      origem.itens.map((item) => ({
        tipo: item.tipo,
        nome: item.nome,
        valor: Number(item.valor),
        papel: item.papel,
        ordem: item.ordem,
        pago: item.pago,
        fonteRendaId: item.fonteRendaId,
      })),
      copiarValoresDe,
    ).map(itemParaCreate),
  },
});

export const buscarMes = async (competencia: string): Promise<MesComItens | null> => {
  if (!isCompetencia(competencia)) return null;
  return prisma.mesFinanceiro.findUnique({
    where: { competencia },
    include: incluirItens,
  });
};

export const obterOuCriarMes = async (competencia: string): Promise<MesComItens> => {
  if (!isCompetencia(competencia)) {
    throw new Error("Competência inválida. Use o formato AAAA-MM.");
  }

  const existente = await prisma.mesFinanceiro.findUnique({
    where: { competencia },
    include: incluirItens,
  });
  if (existente) {
    return (await sincronizarFolhaDoMes(existente.id)) ?? existente;
  }

  const anterior = await prisma.mesFinanceiro.findFirst({
    where: { competencia: { lt: competencia } },
    orderBy: { competencia: "desc" },
    include: incluirItens,
  });

  const criado = await prisma.mesFinanceiro.create({
    data: anterior ? clonarMes(anterior, competencia, TIPOS_COPIA_PADRAO) : mesVazio(competencia),
    include: incluirItens,
  });
  return (await sincronizarFolhaDoMes(criado.id, { incluirNovasRendas: true })) ?? criado;
};

const sincronizarFolhaDoMes = async (
  mesId: string,
  opcoes: { incluirNovasRendas?: boolean } = {},
) => {
  const comRendas = await sincronizarRendasDoMes(mesId, { incluirNovas: opcoes.incluirNovasRendas });
  if (!comRendas) return comRendas;
  return sincronizarContasAnuaisDoMes(comRendas.id);
};

const garantirMesAberto = (mes: { fechado: boolean }) => {
  if (mes.fechado) throw new Error(ERRO_MES_FECHADO);
};

const CAMPOS_DEPOSITO_MES = {
  poupanca: "poupancaDepositado",
  fundo: "fundoDepositado",
  alttab: "alttabDepositado",
  meta: "metaDepositado",
} as const;

export const marcarDeposito = async (
  competencia: string,
  campo: keyof typeof CAMPOS_DEPOSITO_MES,
  depositado: boolean,
) => {
  const mes = await buscarMes(competencia);
  if (!mes) throw new Error("Mês não encontrado.");
  garantirMesAberto(mes);
  return prisma.mesFinanceiro.update({
    where: { id: mes.id },
    data: { [CAMPOS_DEPOSITO_MES[campo]]: Boolean(depositado) },
  });
};

export const salvarMes = async (payload: MesDTO): Promise<MesComItens> => {
  if (!isCompetencia(payload.competencia)) {
    throw new Error("Competência inválida. Use o formato AAAA-MM.");
  }

  return prisma.$transaction(async (tx) => {
    const existente = await tx.mesFinanceiro.findUnique({
      where: { competencia: payload.competencia },
    });
    if (existente) garantirMesAberto(existente);

    const mes = await tx.mesFinanceiro.upsert({
      where: { competencia: payload.competencia },
      create: {
        competencia: payload.competencia,
        feiraReal: payload.feiraReal,
        cartaoReal: payload.cartaoReal,
        gasolinaReal: payload.gasolinaReal,
        fundoReal: payload.fundoReal,
        alttabReal: payload.alttabReal,
        poupancaReal: payload.poupancaReal,
        poupancaEditado: payload.poupancaEditado,
      },
      update: {
        feiraReal: payload.feiraReal,
        cartaoReal: payload.cartaoReal,
        gasolinaReal: payload.gasolinaReal,
        fundoReal: payload.fundoReal,
        alttabReal: payload.alttabReal,
        poupancaReal: payload.poupancaReal,
        poupancaEditado: payload.poupancaEditado,
      },
    });

    await tx.itemFinanceiro.deleteMany({ where: { mesId: mes.id } });
    if (payload.itens.length) {
      await tx.itemFinanceiro.createMany({
        data: payload.itens.map((item, ordem) => ({
          mesId: mes.id,
          tipo: item.tipo,
          nome: item.nome.trim() || "Sem nome",
          valor: item.valor,
          papel: item.tipo === "EXTRA" ? (item.papel ?? "OUTRO") : null,
          ordem: item.ordem ?? ordem,
          pago: item.tipo === "CONTA" || item.tipo === "EXTRA_MES" || item.tipo === "ANUAL" ? Boolean(item.pago) : false,
          fonteRendaId: item.fonteRendaId ?? null,
          contaAnualId: item.contaAnualId ?? null,
        })),
      });
    }

    return tx.mesFinanceiro.findUniqueOrThrow({
      where: { id: mes.id },
      include: incluirItens,
    });
  }).then(async (salvo) => (await sincronizarContasAnuaisDoMes(salvo.id)) ?? salvo);
};

export const listarMesesRecentes = async (limite = 6): Promise<MesComItens[]> => {
  const meses = await prisma.mesFinanceiro.findMany({
    include: incluirItens,
    orderBy: { competencia: "desc" },
    take: limite,
  });
  return meses.reverse();
};

export const listarResumos = async () => {
  const meses = await prisma.mesFinanceiro.findMany({
    include: incluirItens,
    orderBy: { competencia: "asc" },
  });
  const [compras, recorrentes, preferencia, emprestimos] = await Promise.all([
    listarComprasCartao(),
    listarRecorrentesCartao(),
    obterPreferenciaCasa(),
    listarEmprestimosMeta(),
  ]);
  const cartaoFixo = somarRecorrentes(recorrentes);

  return meses.map((mes) => {
    const resultado = calcularMesPersistido(
      mes,
      faturaDoMes(compras, mes.competencia),
      preferencia.gastoPessoalMes,
      somarDevolucao(emprestimos, mes.competencia),
      cartaoFixo,
    );
    const dto = mesParaDto(mes);
    const progresso = progressoPagamento(dto.itens);
    return {
      competencia: mes.competencia,
      ganhou: resultado.resumo.ganhou,
      gastoMensal: resultado.gastoMensal,
      gasto: resultado.resumo.gasto,
      investido: resultado.investimentos.totalInvestido,
      sobrou: resultado.resumo.sobrou,
      meta: resultado.distribuicao.metaFinal,
      contasPagas: progresso.pagas,
      contasTotal: progresso.total,
      fechado: mes.fechado,
    };
  });
};

export const criarProximoMes = async (atual: string, copiarValoresDe?: unknown) => {
  const proximo = avancarCompetencia(atual);
  const existente = await buscarMes(proximo);
  if (existente) return { mes: mesParaDto(existente), criado: false };

  const origem = await buscarMes(atual);
  const tipos = tiposCopiaValidos(copiarValoresDe);
  const criado = origem
    ? await prisma.mesFinanceiro.create({
        data: clonarMes(origem, proximo, tipos),
        include: incluirItens,
      })
    : await obterOuCriarMes(proximo);
  const mes = (await sincronizarFolhaDoMes(criado.id, { incluirNovasRendas: true })) ?? criado;

  return { mes: mesParaDto(mes), criado: true };
};

export const trazerValoresMesAnterior = async (competencia: string, copiarValoresDe: unknown) => {
  const mes = await buscarMes(competencia);
  if (!mes) throw new Error("Mês não encontrado.");
  garantirMesAberto(mes);

  const anterior = await buscarMes(avancarCompetencia(competencia, -1));
  if (!anterior) throw new Error("Não há mês anterior para copiar.");

  const tipos = tiposCopiaValidos(copiarValoresDe);
  const destino = mesParaDto(mes);
  const origem = mesParaDto(anterior);
  return salvarMes({
    ...destino,
    itens: aplicarValoresDoMesAnterior(destino.itens, origem.itens, tipos).map((item) => ({
      ...item,
      pago: Boolean(item.pago),
    })),
  });
};

export const definirMesFechado = async (competencia: string, fechado: boolean) => {
  if (!isCompetencia(competencia)) {
    throw new Error("Competência inválida. Use o formato AAAA-MM.");
  }

  const mes = await prisma.mesFinanceiro.findUnique({ where: { competencia } });
  if (!mes) throw new Error("Mês não encontrado.");
  if (mes.fechado === fechado) {
    return prisma.mesFinanceiro.findUniqueOrThrow({
      where: { competencia },
      include: incluirItens,
    });
  }

  return prisma.mesFinanceiro.update({
    where: { competencia },
    data: {
      fechado,
      fechadoEm: fechado ? new Date() : null,
    },
    include: incluirItens,
  });
};
