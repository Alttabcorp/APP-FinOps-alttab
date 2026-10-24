import { prisma } from "@/lib/db/prisma";
import {
  emprestimoComSituacao,
  emprestimoParaDto,
  type DevolucaoMetaPayload,
  type EmprestimoMetaComSituacao,
  type EmprestimoMetaPayload,
} from "@/lib/application/emprestimo-meta-mapper";
import { valorDaParcela } from "@/lib/domain/financeiro/cartao";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";
import {
  abertoEmprestimoMeta,
  devolverParaMeta,
  sacarDaMeta,
  somarDevolucao,
} from "@/lib/domain/financeiro/emprestimo-meta";

const LIMITE_NOME = 80;

const incluirConta = { conta: { select: { nome: true } } } as const;

const validarPayload = (payload: EmprestimoMetaPayload) => {
  const nome = payload.nome.trim();
  if (!nome) throw new Error("Informe o que foi comprado.");
  if (nome.length > LIMITE_NOME) throw new Error("O nome da compra é longo demais.");
  const valorTotal = Number(payload.valorTotal);
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error("Informe o valor da compra à vista.");
  }
  const parcelas = Math.trunc(Number(payload.parcelas));
  if (!Number.isFinite(parcelas) || parcelas < 1 || parcelas > 48) {
    throw new Error("Informe de 1 a 48 parcelas para devolver.");
  }
  if (!isCompetencia(payload.competenciaInicio)) {
    throw new Error("Informe o mês da primeira devolução.");
  }
  return {
    nome,
    valorTotal,
    parcelas,
    valorParcela: valorDaParcela(valorTotal, parcelas, 0),
    competenciaInicio: payload.competenciaInicio,
  };
};

const contaMeta = async (contaId?: string) => {
  if (contaId) {
    const conta = await prisma.contaBancaria.findUnique({ where: { id: contaId } });
    if (!conta) throw new Error("Conta da meta não encontrada.");
    if (conta.finalidade !== "META") throw new Error("Só a meta empresta para compra à vista.");
    return conta;
  }
  const conta = await prisma.contaBancaria.findFirst({
    where: { finalidade: "META" },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });
  if (!conta) throw new Error("Cadastre a conta da meta antes de sacar.");
  return conta;
};

export const listarEmprestimosMeta = async (
  competencia = competenciaAtual(),
): Promise<EmprestimoMetaComSituacao[]> => {
  const emprestimos = await prisma.emprestimoMeta.findMany({
    include: incluirConta,
    orderBy: [{ competenciaInicio: "desc" }, { criadoEm: "desc" }],
  });
  return emprestimos.map((emprestimo) => emprestimoComSituacao(emprestimoParaDto(emprestimo), competencia));
};

export const reposicaoMetaNaCompetencia = async (competencia: string) => {
  const emprestimos = await listarEmprestimosMeta(competencia);
  return somarDevolucao(emprestimos, competencia);
};

export const registrarSaqueMeta = async (payload: EmprestimoMetaPayload): Promise<EmprestimoMetaComSituacao> => {
  const dados = validarPayload(payload);
  const conta = await contaMeta(payload.contaId);
  const saque = sacarDaMeta(Number(conta.saldo), dados.valorTotal);
  const ultima = await prisma.emprestimoMeta.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });

  const criado = await prisma.$transaction(async (tx) => {
    await tx.contaBancaria.update({
      where: { id: conta.id },
      data: { saldo: saque.saldo },
    });
    return tx.emprestimoMeta.create({
      data: {
        ...dados,
        pagoTotal: 0,
        contaId: conta.id,
        ordem: (ultima?.ordem ?? -1) + 1,
      },
      include: incluirConta,
    });
  });

  return emprestimoComSituacao(emprestimoParaDto(criado));
};

export const devolverEmprestimoMeta = async (
  payload: DevolucaoMetaPayload,
): Promise<EmprestimoMetaComSituacao> => {
  const existente = await prisma.emprestimoMeta.findUnique({
    where: { id: payload.id },
    include: { conta: true },
  });
  if (!existente) throw new Error("Compra à vista não encontrada.");
  const aberto = abertoEmprestimoMeta({
    valorTotal: Number(existente.valorTotal),
    pagoTotal: Number(existente.pagoTotal),
  });
  const devolucao = devolverParaMeta(Number(existente.conta.saldo), aberto, payload.valor);

  const atualizado = await prisma.$transaction(async (tx) => {
    await tx.contaBancaria.update({
      where: { id: existente.contaId },
      data: { saldo: devolucao.saldo },
    });
    return tx.emprestimoMeta.update({
      where: { id: existente.id },
      data: { pagoTotal: Number(existente.pagoTotal) + devolucao.pago },
      include: incluirConta,
    });
  });

  return emprestimoComSituacao(emprestimoParaDto(atualizado));
};

export const excluirEmprestimoMeta = async (id: string) => {
  const existente = await prisma.emprestimoMeta.findUnique({
    where: { id },
    include: { conta: true },
  });
  if (!existente) throw new Error("Compra à vista não encontrada.");
  const pago = Number(existente.pagoTotal);
  const valorTotal = Number(existente.valorTotal);

  if (pago < 0.005) {
    await prisma.$transaction(async (tx) => {
      await tx.contaBancaria.update({
        where: { id: existente.contaId },
        data: { saldo: Number(existente.conta.saldo) + valorTotal },
      });
      await tx.emprestimoMeta.delete({ where: { id } });
    });
    return;
  }

  await prisma.emprestimoMeta.delete({ where: { id } });
};
