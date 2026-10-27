import type { ContaAnual } from "@prisma/client";
import type { LadoContaAnual } from "@/lib/domain/financeiro/anual";

export type ContaAnualDTO = {
  id: string;
  nome: string;
  valor: number;
  dia: number;
  mes: number;
  parcelas: number;
  valorParcela: number;
  lado: LadoContaAnual;
  banco: string;
  chavePix: string;
  ordem: number;
};

export type ContaAnualPayload = {
  id?: string;
  nome: string;
  valor: number;
  dia: number;
  mes: number;
  parcelas: number;
  lado: LadoContaAnual;
  banco?: string;
  chavePix?: string;
};

export const contaAnualParaDto = (conta: ContaAnual): ContaAnualDTO => ({
  id: conta.id,
  nome: conta.nome,
  valor: Number(conta.valor),
  dia: conta.dia,
  mes: conta.mes,
  parcelas: conta.parcelas,
  valorParcela: Number(conta.valorParcela),
  lado: conta.lado,
  banco: conta.banco ?? "",
  chavePix: conta.chavePix ?? "",
  ordem: conta.ordem,
});
