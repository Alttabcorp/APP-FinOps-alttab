import type { ContaBancaria, GastoEmpresa } from "@prisma/client";

export type GastoEmpresaDTO = {
  id: string;
  nome: string;
  nota: string;
  valor: number;
  competencia: string;
  contaId: string;
  contaNome: string;
  ordem: number;
};

export type GastoEmpresaPayload = {
  id?: string;
  nome: string;
  nota?: string;
  valor: number;
  competencia: string;
  contaId?: string;
};

type GastoComConta = GastoEmpresa & { conta: Pick<ContaBancaria, "nome"> };

export const gastoEmpresaParaDto = (gasto: GastoComConta): GastoEmpresaDTO => ({
  id: gasto.id,
  nome: gasto.nome,
  nota: gasto.nota,
  valor: Number(gasto.valor),
  competencia: gasto.competencia,
  contaId: gasto.contaId,
  contaNome: gasto.conta.nome,
  ordem: gasto.ordem,
});
