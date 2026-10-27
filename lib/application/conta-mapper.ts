import type { ContaBancaria } from "@prisma/client";
import {
  calcularProgressoMeta,
  type FinalidadeConta,
  type ProgressoMeta,
} from "@/lib/domain/financeiro/conta";

export type ContaDTO = {
  id: string;
  nome: string;
  finalidade: FinalidadeConta;
  saldo: number;
  meta: number | null;
  metaMensal: number | null;
  banco: string;
  titular: string;
  chavePix: string;
  recebePoupanca: boolean;
  ordem: number;
};

export type ContaComProgresso = ContaDTO & {
  progresso: ProgressoMeta;
  progressoMensal: ProgressoMeta;
};

export type ContaPayload = {
  id?: string;
  nome: string;
  finalidade: FinalidadeConta;
  saldo: number;
  meta?: number | null;
  metaMensal?: number | null;
  banco?: string;
  titular?: string;
  chavePix?: string;
  recebePoupanca?: boolean;
};

const decimalParaNumero = (valor: { toString(): string } | number | null) =>
  valor == null ? null : Number(valor);

export const contaParaDto = (conta: ContaBancaria): ContaDTO => ({
  id: conta.id,
  nome: conta.nome,
  finalidade: conta.finalidade as FinalidadeConta,
  saldo: Number(conta.saldo),
  meta: decimalParaNumero(conta.meta),
  metaMensal: decimalParaNumero(conta.metaMensal),
  banco: conta.banco ?? "",
  titular: conta.titular ?? "",
  chavePix: conta.chavePix ?? "",
  recebePoupanca: Boolean(conta.recebePoupanca),
  ordem: conta.ordem,
});

export const contaComProgresso = (conta: ContaDTO, rendimentoMes = 0): ContaComProgresso => ({
  ...conta,
  progresso: calcularProgressoMeta(conta.saldo, conta.meta),
  progressoMensal: calcularProgressoMeta(rendimentoMes, conta.metaMensal),
});
