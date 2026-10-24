import { prisma } from "@/lib/db/prisma";
import {
  contaComProgresso,
  contaParaDto,
  type ContaComProgresso,
  type ContaDTO,
  type ContaPayload,
} from "@/lib/application/conta-mapper";
import {
  contasPadrao,
  isFinalidadeConta,
  RENDA_EMPRESA_MES,
  RENDA_INVESTIMENTO_MES,
} from "@/lib/domain/financeiro/conta";

const LIMITE_NOME = 80;

const normalizarMeta = (valor: number | null | undefined) => {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
};

const validarPayload = (payload: ContaPayload) => {
  const nome = payload.nome.trim();
  if (!nome) throw new Error("Informe o nome da conta.");
  if (nome.length > LIMITE_NOME) throw new Error("O nome da conta é longo demais.");
  if (!isFinalidadeConta(payload.finalidade)) {
    throw new Error("Escolha a finalidade da conta.");
  }
  const saldo = Number(payload.saldo);
  if (!Number.isFinite(saldo)) throw new Error("Informe um saldo válido.");
  if (saldo < 0) throw new Error("O saldo não pode ser negativo.");
  return {
    nome,
    finalidade: payload.finalidade,
    saldo,
    meta: normalizarMeta(payload.meta),
    metaMensal: normalizarMeta(payload.metaMensal),
  };
};

const garantirContasPadrao = async () => {
  const existentes = await prisma.contaBancaria.findMany();
  if (existentes.length === 0) {
    await prisma.contaBancaria.createMany({
      data: contasPadrao().map((conta) => ({
        nome: conta.nome,
        finalidade: conta.finalidade,
        saldo: conta.saldo,
        meta: conta.meta,
        metaMensal: conta.metaMensal,
        ordem: conta.ordem ?? 0,
        atualizadoEm: new Date(),
      })),
    });
    return;
  }

  const tem = new Set(existentes.map((conta) => conta.finalidade));
  const ultima = existentes.reduce((acc, conta) => Math.max(acc, conta.ordem), -1);
  let ordem = ultima;
  for (const padrao of contasPadrao()) {
    if (tem.has(padrao.finalidade)) continue;
    ordem += 1;
    await prisma.contaBancaria.create({
      data: {
        nome: padrao.nome,
        finalidade: padrao.finalidade,
        saldo: 0,
        meta: padrao.meta,
        metaMensal: padrao.metaMensal,
        ordem,
      },
    });
  }

  for (const conta of existentes) {
    if (conta.finalidade === "INVESTIMENTO" && conta.metaMensal == null) {
      await prisma.contaBancaria.update({
        where: { id: conta.id },
        data: { metaMensal: RENDA_INVESTIMENTO_MES },
      });
    }
    if (conta.finalidade === "EMPRESA" && conta.metaMensal == null) {
      await prisma.contaBancaria.update({
        where: { id: conta.id },
        data: { metaMensal: RENDA_EMPRESA_MES },
      });
    }
  }
};

export const listarContas = async (): Promise<ContaComProgresso[]> => {
  await garantirContasPadrao();
  const contas = await prisma.contaBancaria.findMany({
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });
  return contas.map((conta) => contaComProgresso(contaParaDto(conta)));
};

export const salvarConta = async (payload: ContaPayload): Promise<ContaDTO> => {
  const dados = validarPayload(payload);

  if (payload.id) {
    const existente = await prisma.contaBancaria.findUnique({ where: { id: payload.id } });
    if (!existente) throw new Error("Conta não encontrada.");
    const atualizada = await prisma.contaBancaria.update({
      where: { id: payload.id },
      data: dados,
    });
    return contaParaDto(atualizada);
  }

  const ultima = await prisma.contaBancaria.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const criada = await prisma.contaBancaria.create({
    data: {
      ...dados,
      ordem: (ultima?.ordem ?? -1) + 1,
    },
  });
  return contaParaDto(criada);
};

export const excluirConta = async (id: string) => {
  const existente = await prisma.contaBancaria.findUnique({
    where: { id },
    include: { _count: { select: { emprestimos: true, gastosEmpresa: true } } },
  });
  if (!existente) throw new Error("Conta não encontrada.");
  if (existente._count.emprestimos > 0) {
    throw new Error("Há compras à vista nesta meta. Quite ou desfaça antes de remover a conta.");
  }
  if (existente._count.gastosEmpresa > 0) {
    throw new Error("Há gastos anotados nesta conta da empresa. Desfaça antes de remover.");
  }
  await prisma.contaBancaria.delete({ where: { id } });
};
