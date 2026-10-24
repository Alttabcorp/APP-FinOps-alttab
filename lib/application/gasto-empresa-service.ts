import { prisma } from "@/lib/db/prisma";
import { gastoEmpresaParaDto, type GastoEmpresaDTO, type GastoEmpresaPayload } from "@/lib/application/gasto-empresa-mapper";
import { isCompetencia } from "@/lib/domain/financeiro/competencia";
import { devolverGastoEmpresa, retirarDaEmpresa } from "@/lib/domain/financeiro/gasto-empresa";

const LIMITE_NOME = 80;
const LIMITE_NOTA = 240;

const incluirConta = { conta: { select: { nome: true } } } as const;

const validarTexto = (payload: GastoEmpresaPayload) => {
  const nome = payload.nome.trim();
  if (!nome) throw new Error("Informe em que foi gasto.");
  if (nome.length > LIMITE_NOME) throw new Error("O nome do gasto é longo demais.");
  const nota = (payload.nota ?? "").trim();
  if (nota.length > LIMITE_NOTA) throw new Error("A anotação é longa demais.");
  if (!isCompetencia(payload.competencia)) {
    throw new Error("Informe o mês do gasto.");
  }
  return { nome, nota, competencia: payload.competencia };
};

const validarNovo = (payload: GastoEmpresaPayload) => {
  const texto = validarTexto(payload);
  const valor = Number(payload.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("Informe o valor do gasto.");
  }
  return { ...texto, valor };
};

const contaEmpresa = async (contaId?: string) => {
  if (contaId) {
    const conta = await prisma.contaBancaria.findUnique({ where: { id: contaId } });
    if (!conta) throw new Error("Conta da empresa não encontrada.");
    if (conta.finalidade !== "EMPRESA") throw new Error("Só a conta da empresa registra esse gasto.");
    return conta;
  }
  const conta = await prisma.contaBancaria.findFirst({
    where: { finalidade: "EMPRESA" },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });
  if (!conta) throw new Error("Cadastre a conta da empresa antes de anotar um gasto.");
  return conta;
};

export const listarGastosEmpresa = async (): Promise<GastoEmpresaDTO[]> => {
  const gastos = await prisma.gastoEmpresa.findMany({
    include: incluirConta,
    orderBy: [{ competencia: "desc" }, { criadoEm: "desc" }],
  });
  return gastos.map(gastoEmpresaParaDto);
};

export const registrarGastoEmpresa = async (payload: GastoEmpresaPayload): Promise<GastoEmpresaDTO> => {
  const dados = validarNovo(payload);
  const conta = await contaEmpresa(payload.contaId);
  const saida = retirarDaEmpresa(Number(conta.saldo), dados.valor);
  const ultima = await prisma.gastoEmpresa.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });

  const criado = await prisma.$transaction(async (tx) => {
    await tx.contaBancaria.update({
      where: { id: conta.id },
      data: { saldo: saida.saldo },
    });
    return tx.gastoEmpresa.create({
      data: {
        ...dados,
        contaId: conta.id,
        ordem: (ultima?.ordem ?? -1) + 1,
      },
      include: incluirConta,
    });
  });

  return gastoEmpresaParaDto(criado);
};

export const atualizarGastoEmpresa = async (payload: GastoEmpresaPayload): Promise<GastoEmpresaDTO> => {
  if (!payload.id) throw new Error("Gasto não encontrado.");
  const existente = await prisma.gastoEmpresa.findUnique({ where: { id: payload.id } });
  if (!existente) throw new Error("Gasto não encontrado.");
  const dados = validarTexto(payload);
  const atualizado = await prisma.gastoEmpresa.update({
    where: { id: payload.id },
    data: dados,
    include: incluirConta,
  });
  return gastoEmpresaParaDto(atualizado);
};

export const excluirGastoEmpresa = async (id: string) => {
  const existente = await prisma.gastoEmpresa.findUnique({
    where: { id },
    include: { conta: true },
  });
  if (!existente) throw new Error("Gasto não encontrado.");
  const volta = devolverGastoEmpresa(Number(existente.conta.saldo), Number(existente.valor));
  await prisma.$transaction(async (tx) => {
    await tx.contaBancaria.update({
      where: { id: existente.contaId },
      data: { saldo: volta.saldo },
    });
    await tx.gastoEmpresa.delete({ where: { id } });
  });
};
