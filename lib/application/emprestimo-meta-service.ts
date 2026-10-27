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
import { contaPodeSacar } from "@/lib/domain/financeiro/conta";
import {
  abertoEmprestimoMeta,
  avaliarReposicao,
  devolverParaMeta,
  sacarDaMeta,
  somarDevolucao,
} from "@/lib/domain/financeiro/emprestimo-meta";

const LIMITE_NOME = 80;

const incluirConta = { conta: { select: { nome: true, finalidade: true } } } as const;

const validarPayload = (payload: EmprestimoMetaPayload) => {
  const nome = payload.nome.trim();
  if (!nome) throw new Error("Informe o motivo da retirada.");
  if (nome.length > LIMITE_NOME) throw new Error("O nome da retirada é longo demais.");
  const valorTotal = Number(payload.valorTotal);
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error("Informe o valor da retirada.");
  }
  const parcelas = Math.trunc(Number(payload.parcelas));
  if (!Number.isFinite(parcelas) || parcelas < 1 || parcelas > 48) {
    throw new Error("Informe de 1 a 48 parcelas para repor.");
  }
  if (!isCompetencia(payload.competenciaInicio)) {
    throw new Error("Informe o mês da primeira reposição.");
  }
  return {
    nome,
    valorTotal,
    parcelas,
    valorParcela: valorDaParcela(valorTotal, parcelas, 0),
    competenciaInicio: payload.competenciaInicio,
  };
};

const contaSacavel = async (contaId?: string) => {
  if (contaId) {
    const conta = await prisma.contaBancaria.findUnique({ where: { id: contaId } });
    if (!conta) throw new Error("Conta não encontrada.");
    if (!contaPodeSacar(conta.finalidade)) {
      throw new Error("Só poupança, reserva e meta podem ter retirada.");
    }
    return conta;
  }
  const conta = await prisma.contaBancaria.findFirst({
    where: { finalidade: { in: ["META", "RESERVA", "POUPANCA"] } },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });
  if (!conta) throw new Error("Cadastre poupança, reserva ou meta antes de sacar.");
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
  const conta = await contaSacavel(payload.contaId);
  const sobraMes = Number.isFinite(Number(payload.sobraMes)) ? Number(payload.sobraMes) : 0;
  const plano = avaliarReposicao(dados.valorTotal, dados.parcelas, sobraMes);
  if (!plano.cabeNoMes && !payload.confirmado) {
    throw new Error(
      "Não dá para repor essa retirada sem deixar o mês negativo. Confirme se quiser seguir mesmo assim.",
    );
  }
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
  if (!existente) throw new Error("Retirada não encontrada.");
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
  if (!existente) throw new Error("Retirada não encontrada.");
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
