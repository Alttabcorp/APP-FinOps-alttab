"use server";

import { revalidatePath } from "next/cache";
import {
  atualizarGastoEmpresa,
  excluirGastoEmpresa,
  registrarGastoEmpresa,
} from "@/lib/application/gasto-empresa-service";
import type { GastoEmpresaDTO, GastoEmpresaPayload } from "@/lib/application/gasto-empresa-mapper";

export type AcaoGastoEmpresaResultado =
  | { ok: true; gasto?: GastoEmpresaDTO }
  | { ok: false; erro: string };

const falha = (erro: unknown, fallback: string): AcaoGastoEmpresaResultado => ({
  ok: false,
  erro: erro instanceof Error ? erro.message : fallback,
});

const revalidar = () => {
  revalidatePath("/empresa");
  revalidatePath("/", "layout");
};

export async function registrarGastoEmpresaAction(
  payload: GastoEmpresaPayload,
): Promise<AcaoGastoEmpresaResultado> {
  try {
    const gasto = await registrarGastoEmpresa(payload);
    revalidar();
    return { ok: true, gasto };
  } catch (erro) {
    return falha(erro, "Não foi possível registrar o gasto da empresa.");
  }
}

export async function atualizarGastoEmpresaAction(
  payload: GastoEmpresaPayload,
): Promise<AcaoGastoEmpresaResultado> {
  try {
    const gasto = await atualizarGastoEmpresa(payload);
    revalidar();
    return { ok: true, gasto };
  } catch (erro) {
    return falha(erro, "Não foi possível atualizar o gasto.");
  }
}

export async function excluirGastoEmpresaAction(id: string): Promise<AcaoGastoEmpresaResultado> {
  try {
    await excluirGastoEmpresa(id);
    revalidar();
    return { ok: true };
  } catch (erro) {
    return falha(erro, "Não foi possível desfazer o gasto.");
  }
}
