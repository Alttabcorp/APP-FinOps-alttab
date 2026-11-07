"use server";

import { revalidatePath } from "next/cache";
import {
  adicionarLancamento,
  removerLancamento,
  salvarDiaFechamentoCartao,
  type CategoriaVariavel,
} from "@/lib/application/lancamento-service";

export type AcaoLancamentoResultado = { ok: true; competencia?: string } | { ok: false; erro: string };

const revalidar = () => {
  revalidatePath("/", "layout");
  revalidatePath("/despesas");
};

const falha = (erro: unknown, padrao: string): AcaoLancamentoResultado => ({
  ok: false,
  erro: erro instanceof Error ? erro.message : padrao,
});

export async function adicionarLancamentoAction(payload: {
  competencia: string;
  categoria: CategoriaVariavel;
  valor: number;
  descricao?: string;
}): Promise<AcaoLancamentoResultado> {
  try {
    const { competencia } = await adicionarLancamento(payload);
    revalidar();
    return { ok: true, competencia };
  } catch (erro) {
    return falha(erro, "Não foi possível adicionar o gasto.");
  }
}

export async function removerLancamentoAction(id: string): Promise<AcaoLancamentoResultado> {
  try {
    await removerLancamento(id);
    revalidar();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível remover o lançamento.");
  }
}

export async function salvarDiaFechamentoAction(dia: number): Promise<AcaoLancamentoResultado> {
  try {
    await salvarDiaFechamentoCartao(dia);
    revalidar();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar o dia de fechamento.");
  }
}
