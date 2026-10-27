"use server";

import { revalidatePath } from "next/cache";
import {
  devolverEmprestimoMeta,
  excluirEmprestimoMeta,
  registrarSaqueMeta,
} from "@/lib/application/emprestimo-meta-service";
import type {
  DevolucaoMetaPayload,
  EmprestimoMetaComSituacao,
  EmprestimoMetaPayload,
} from "@/lib/application/emprestimo-meta-mapper";

export type AcaoEmprestimoMetaResultado =
  | { ok: true; emprestimo?: EmprestimoMetaComSituacao }
  | { ok: false; erro: string };

const falha = (erro: unknown, fallback: string): AcaoEmprestimoMetaResultado => ({
  ok: false,
  erro: erro instanceof Error ? erro.message : fallback,
});

const revalidar = () => {
  revalidatePath("/contas");
  revalidatePath("/investimentos");
  revalidatePath("/", "layout");
};

export async function registrarSaqueMetaAction(
  payload: EmprestimoMetaPayload,
): Promise<AcaoEmprestimoMetaResultado> {
  try {
    const emprestimo = await registrarSaqueMeta(payload);
    revalidar();
    return { ok: true, emprestimo };
  } catch (erro) {
    return falha(erro, "Não foi possível registrar a retirada.");
  }
}

export async function devolverEmprestimoMetaAction(
  payload: DevolucaoMetaPayload,
): Promise<AcaoEmprestimoMetaResultado> {
  try {
    const emprestimo = await devolverEmprestimoMeta(payload);
    revalidar();
    return { ok: true, emprestimo };
  } catch (erro) {
    return falha(erro, "Não foi possível repor a retirada.");
  }
}

export async function excluirEmprestimoMetaAction(id: string): Promise<AcaoEmprestimoMetaResultado> {
  try {
    await excluirEmprestimoMeta(id);
    revalidar();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível remover a retirada.");
  }
}
