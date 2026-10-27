"use server";

import { revalidatePath } from "next/cache";
import {
  excluirCompraCartao,
  excluirRecorrenteCartao,
  salvarCompraCartao,
  salvarRecorrenteCartao,
} from "@/lib/application/cartao-service";
import type {
  CompraCartaoDTO,
  CompraCartaoPayload,
  RecorrenteCartaoDTO,
  RecorrenteCartaoPayload,
} from "@/lib/application/cartao-mapper";

export type AcaoCartaoResultado =
  | { ok: true; compra?: CompraCartaoDTO; recorrente?: RecorrenteCartaoDTO }
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

export async function salvarRecorrenteCartaoAction(
  payload: RecorrenteCartaoPayload,
): Promise<AcaoCartaoResultado> {
  try {
    const recorrente = await salvarRecorrenteCartao(payload);
    revalidar();
    return { ok: true, recorrente };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar o gasto fixo.");
  }
}

export async function excluirRecorrenteCartaoAction(id: string): Promise<AcaoCartaoResultado> {
  try {
    await excluirRecorrenteCartao(id);
    revalidar();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível remover o gasto fixo.");
  }
}
