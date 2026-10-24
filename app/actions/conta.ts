"use server";

import { revalidatePath } from "next/cache";
import { excluirConta, salvarConta } from "@/lib/application/conta-service";
import type { ContaDTO, ContaPayload } from "@/lib/application/conta-mapper";

export type AcaoContaResultado =
  | { ok: true; conta?: ContaDTO }
  | { ok: false; erro: string };

const falha = (erro: unknown, fallback: string): AcaoContaResultado => ({
  ok: false,
  erro: erro instanceof Error ? erro.message : fallback,
});

const revalidarContas = () => {
  revalidatePath("/contas");
  revalidatePath("/", "layout");
};

export async function salvarContaAction(payload: ContaPayload): Promise<AcaoContaResultado> {
  try {
    const conta = await salvarConta(payload);
    revalidarContas();
    return { ok: true, conta };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar a conta.");
  }
}

export async function excluirContaAction(id: string): Promise<AcaoContaResultado> {
  try {
    await excluirConta(id);
    revalidarContas();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível remover a conta.");
  }
}
