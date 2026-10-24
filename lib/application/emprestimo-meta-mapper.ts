import type { ContaBancaria, EmprestimoMeta } from "@prisma/client";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";
import {
  progressoDevolucao,
  situacaoEmprestimoMeta,
  type SituacaoEmprestimoMeta,
} from "@/lib/domain/financeiro/emprestimo-meta";
import type { ProgressoMeta } from "@/lib/domain/financeiro/conta";

export type EmprestimoMetaDTO = {
  id: string;
  nome: string;
  valorTotal: number;
  parcelas: number;
  valorParcela: number;
  competenciaInicio: string;
  pagoTotal: number;
  contaId: string;
  contaNome: string;
  ordem: number;
};

export type EmprestimoMetaComSituacao = EmprestimoMetaDTO &
  SituacaoEmprestimoMeta & {
    progresso: ProgressoMeta;
  };

export type EmprestimoMetaPayload = {
  nome: string;
  valorTotal: number;
  parcelas: number;
  competenciaInicio: string;
  contaId?: string;
};

export type DevolucaoMetaPayload = {
  id: string;
  valor: number;
};

type EmprestimoComConta = EmprestimoMeta & { conta: Pick<ContaBancaria, "nome"> };

export const emprestimoParaDto = (emprestimo: EmprestimoComConta): EmprestimoMetaDTO => ({
  id: emprestimo.id,
  nome: emprestimo.nome,
  valorTotal: Number(emprestimo.valorTotal),
  parcelas: emprestimo.parcelas,
  valorParcela: Number(emprestimo.valorParcela),
  competenciaInicio: emprestimo.competenciaInicio,
  pagoTotal: Number(emprestimo.pagoTotal),
  contaId: emprestimo.contaId,
  contaNome: emprestimo.conta.nome,
  ordem: emprestimo.ordem,
});

export const emprestimoComSituacao = (
  emprestimo: EmprestimoMetaDTO,
  competencia = competenciaAtual(),
): EmprestimoMetaComSituacao => ({
  ...emprestimo,
  ...situacaoEmprestimoMeta(emprestimo, competencia),
  progresso: progressoDevolucao(emprestimo),
});
