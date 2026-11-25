import { prisma } from "@/lib/db/prisma";
import {
  compraParaDto,
  recorrenteParaDto,
  type CompraCartaoDTO,
  type CompraCartaoPayload,
  type RecorrenteCartaoDTO,
  type RecorrenteCartaoPayload,
} from "@/lib/application/cartao-mapper";
import { adicionarLancamento } from "@/lib/application/lancamento-service";
import {
  avulsosCompraDoMes,
  faturaAvulsosCompraDoMes,
  faturaDoMes,
  faturaParcelasDoMes,
  parcelasDoMes,
  somarRecorrentes,
  valorDaParcela,
} from "@/lib/domain/financeiro/cartao";
import { isCompetencia } from "@/lib/domain/financeiro/competencia";

const LIMITE_NOME = 80;

const validarPayload = (payload: CompraCartaoPayload) => {
  const nome = payload.nome.trim();
  if (!nome) throw new Error("Informe o que foi comprado.");
  if (nome.length > LIMITE_NOME) throw new Error("O nome da compra é longo demais.");
  const valorTotal = Number(payload.valorTotal);
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error("Informe o valor total da compra.");
  }
  const parcelas = Math.trunc(Number(payload.parcelas));
  if (!Number.isFinite(parcelas) || parcelas < 1 || parcelas > 48) {
    throw new Error("Informe de 1 a 48 parcelas.");
  }
  if (!isCompetencia(payload.competenciaInicio)) {
    throw new Error("Informe o mês da primeira parcela.");
  }
  return {
    nome,
    valorTotal,
    parcelas,
    valorParcela: valorDaParcela(valorTotal, parcelas, 0),
    competenciaInicio: payload.competenciaInicio,
  };
};

export const listarComprasCartao = async (): Promise<CompraCartaoDTO[]> => {
  const compras = await prisma.compraCartao.findMany({
    orderBy: [{ competenciaInicio: "desc" }, { criadoEm: "desc" }],
  });
  return compras.map(compraParaDto);
};

export type SalvarCompraCartaoResultado =
  | { tipo: "parcela"; compra: CompraCartaoDTO }
  | { tipo: "avulso"; competencia: string };

/**
 * 2x+ → compra parcelada. 1x nova → lançamento avulso da fatura.
 * Editar uma compra existente (com id) sempre atualiza CompraCartao.
 */
export const salvarCompraCartao = async (
  payload: CompraCartaoPayload,
): Promise<SalvarCompraCartaoResultado> => {
  const dados = validarPayload(payload);

  // Compra à vista (1x): entra como avulso, não como "parcela 1/1".
  if (!payload.id && dados.parcelas === 1) {
    const { competencia } = await adicionarLancamento({
      competencia: dados.competenciaInicio,
      competenciaFatura: dados.competenciaInicio,
      categoria: "cartao",
      valor: dados.valorTotal,
      descricao: dados.nome,
    });
    return { tipo: "avulso", competencia };
  }

  if (payload.id) {
    const existente = await prisma.compraCartao.findUnique({ where: { id: payload.id } });
    if (!existente) throw new Error("Compra não encontrada.");
    return {
      tipo: "parcela",
      compra: compraParaDto(
        await prisma.compraCartao.update({
          where: { id: payload.id },
          data: dados,
        }),
      ),
    };
  }
  const ultima = await prisma.compraCartao.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  return {
    tipo: "parcela",
    compra: compraParaDto(
      await prisma.compraCartao.create({
        data: { ...dados, ordem: (ultima?.ordem ?? -1) + 1 },
      }),
    ),
  };
};

export const excluirCompraCartao = async (id: string) => {
  const existente = await prisma.compraCartao.findUnique({ where: { id } });
  if (!existente) throw new Error("Compra não encontrada.");
  await prisma.compraCartao.delete({ where: { id } });
};

export const listarRecorrentesCartao = async (): Promise<RecorrenteCartaoDTO[]> => {
  const recorrentes = await prisma.recorrenteCartao.findMany({
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });
  return recorrentes.map(recorrenteParaDto);
};

export const salvarRecorrenteCartao = async (payload: RecorrenteCartaoPayload): Promise<RecorrenteCartaoDTO> => {
  const nome = payload.nome.trim();
  if (!nome) throw new Error("Informe o nome do gasto fixo.");
  if (nome.length > LIMITE_NOME) throw new Error("O nome do gasto é longo demais.");
  const valor = Number(payload.valor);
  if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe o valor mensal.");
  const dados = { nome, valor };

  if (payload.id) {
    const existente = await prisma.recorrenteCartao.findUnique({ where: { id: payload.id } });
    if (!existente) throw new Error("Gasto fixo não encontrado.");
    return recorrenteParaDto(
      await prisma.recorrenteCartao.update({
        where: { id: payload.id },
        data: dados,
      }),
    );
  }

  const ultima = await prisma.recorrenteCartao.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  return recorrenteParaDto(
    await prisma.recorrenteCartao.create({
      data: { ...dados, ordem: (ultima?.ordem ?? -1) + 1 },
    }),
  );
};

export const excluirRecorrenteCartao = async (id: string) => {
  const existente = await prisma.recorrenteCartao.findUnique({ where: { id } });
  if (!existente) throw new Error("Gasto fixo não encontrado.");
  await prisma.recorrenteCartao.delete({ where: { id } });
};

export const faturaCartaoNaCompetencia = async (competencia: string) => {
  const [compras, recorrentes] = await Promise.all([listarComprasCartao(), listarRecorrentesCartao()]);
  const parcelas = parcelasDoMes(compras, competencia);
  const avulsosCompra = avulsosCompraDoMes(compras, competencia);
  const faturaParcelas = faturaParcelasDoMes(compras, competencia);
  const faturaAvulsosCompra = faturaAvulsosCompraDoMes(compras, competencia);
  const faturaFixo = somarRecorrentes(recorrentes);
  return {
    compras,
    recorrentes,
    parcelas,
    avulsosCompra,
    faturaParcelas,
    faturaAvulsosCompra,
    /** Parcelas + compras 1x legadas (sem lançamentos avulsos do mês). */
    faturaCompras: faturaDoMes(compras, competencia),
    faturaFixo,
    fatura: faturaParcelas + faturaAvulsosCompra + faturaFixo,
  };
};
