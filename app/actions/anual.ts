"use server";

import { revalidatePath } from "next/cache";
import { excluirContaAnual, salvarContaAnual } from "@/lib/application/anual-service";
import type { ContaAnualDTO, ContaAnualPayload } from "@/lib/application/anual-mapper";

export type AcaoAnualResultado =
  | { ok: true; conta?: ContaAnualDTO }
  | { ok: false; erro: string };

const falha = (erro: unknown, fallback: string): AcaoAnualResultado => ({
  ok: false,
  erro: erro instanceof Error ? erro.message : fallback,
});

const revalidar = () => {
  revalidatePath("/anuais");
  revalidatePath("/", "layout");
};

export async function salvarContaAnualAction(payload: ContaAnualPayload): Promise<AcaoAnualResultado> {
  try {
    const conta = await salvarContaAnual(payload);
    revalidar();
    return { ok: true, conta };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar a conta anual.");
  }
}

export async function excluirContaAnualAction(id: string): Promise<AcaoAnualResultado> {
  try {
    await excluirContaAnual(id);
    revalidar();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível remover a conta anual.");
  }
}
