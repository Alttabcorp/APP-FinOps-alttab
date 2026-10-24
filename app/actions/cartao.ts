"use server";

import { revalidatePath } from "next/cache";
import { excluirCompraCartao, salvarCompraCartao } from "@/lib/application/cartao-service";
import type { CompraCartaoDTO, CompraCartaoPayload } from "@/lib/application/cartao-mapper";

export type AcaoCartaoResultado =
  | { ok: true; compra?: CompraCartaoDTO }
  | { ok: false; erro: string };

const falha = (erro: unknown, fallback: string): AcaoCartaoResultado => ({
  ok: false,
  erro: erro instanceof Error ? erro.message : fallback,
});

const revalidar = () => {
  revalidatePath("/cartao");
  revalidatePath("/", "layout");
};

export async function salvarCompraCartaoAction(payload: CompraCartaoPayload): Promise<AcaoCartaoResultado> {
  try {
    const compra = await salvarCompraCartao(payload);
    revalidar();
    return { ok: true, compra };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar a compra.");
  }
}

export async function excluirCompraCartaoAction(id: string): Promise<AcaoCartaoResultado> {
  try {
    await excluirCompraCartao(id);
    revalidar();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível remover a compra.");
  }
}
