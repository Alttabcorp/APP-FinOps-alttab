import { prisma } from "@/lib/db/prisma";
import { compraParaDto, type CompraCartaoDTO, type CompraCartaoPayload } from "@/lib/application/cartao-mapper";
import { faturaDoMes, parcelasDoMes, valorDaParcela } from "@/lib/domain/financeiro/cartao";
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

export const salvarCompraCartao = async (payload: CompraCartaoPayload): Promise<CompraCartaoDTO> => {
  const dados = validarPayload(payload);
  if (payload.id) {
    const existente = await prisma.compraCartao.findUnique({ where: { id: payload.id } });
    if (!existente) throw new Error("Compra não encontrada.");
    return compraParaDto(
      await prisma.compraCartao.update({
        where: { id: payload.id },
        data: dados,
      }),
    );
  }
  const ultima = await prisma.compraCartao.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  return compraParaDto(
    await prisma.compraCartao.create({
      data: { ...dados, ordem: (ultima?.ordem ?? -1) + 1 },
    }),
  );
};

export const excluirCompraCartao = async (id: string) => {
  const existente = await prisma.compraCartao.findUnique({ where: { id } });
  if (!existente) throw new Error("Compra não encontrada.");
  await prisma.compraCartao.delete({ where: { id } });
};

export const faturaCartaoNaCompetencia = async (competencia: string) => {
  const compras = await listarComprasCartao();
  return {
    compras,
    parcelas: parcelasDoMes(compras, competencia),
    fatura: faturaDoMes(compras, competencia),
  };
};
