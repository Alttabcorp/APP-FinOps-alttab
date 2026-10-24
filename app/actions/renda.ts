"use server";

import { revalidatePath } from "next/cache";
import {
  excluirRenda,
  salvarGastoPessoalMes,
  salvarMetaRendimentoPassivo,
  salvarRenda,
} from "@/lib/application/renda-service";
import type { FonteRendaDTO, FonteRendaPayload } from "@/lib/application/renda-mapper";

export type AcaoRendaResultado =
  | { ok: true; renda?: FonteRendaDTO; metaRendimentoPassivo?: number | null; gastoPessoalMes?: number | null }
  | { ok: false; erro: string };

const falha = (erro: unknown, fallback: string): AcaoRendaResultado => ({
  ok: false,
  erro: erro instanceof Error ? erro.message : fallback,
});

const revalidar = () => {
  revalidatePath("/rendas");
  revalidatePath("/entradas");
  revalidatePath("/contas");
  revalidatePath("/", "layout");
};

export async function salvarRendaAction(payload: FonteRendaPayload): Promise<AcaoRendaResultado> {
  try {
    const renda = await salvarRenda(payload);
    revalidar();
    return { ok: true, renda };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar a renda.");
  }
}

export async function excluirRendaAction(id: string): Promise<AcaoRendaResultado> {
  try {
    await excluirRenda(id);
    revalidar();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível remover a renda.");
  }
}

export async function salvarGastoPessoalAction(valor: number): Promise<AcaoRendaResultado> {
  try {
    const preferencia = await salvarGastoPessoalMes(valor);
    revalidar();
    return { ok: true, gastoPessoalMes: preferencia.gastoPessoalMes };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar o gasto pessoal.");
  }
}

export async function salvarMetaRendimentoAction(valor: number): Promise<AcaoRendaResultado> {
  try {
    const preferencia = await salvarMetaRendimentoPassivo(valor);
    revalidar();
    return { ok: true, metaRendimentoPassivo: preferencia.metaRendimentoPassivo };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar a meta de rendimento.");
  }
}
