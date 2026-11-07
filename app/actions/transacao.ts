"use server";

import { revalidatePath } from "next/cache";
import { registrarEntrada, type EntradaPayload } from "@/lib/application/transacao-service";

export type AcaoEntradaResultado = { ok: true; mensagem: string } | { ok: false; erro: string };

export async function registrarEntradaAction(payload: EntradaPayload): Promise<AcaoEntradaResultado> {
  try {
    const resultado = await registrarEntrada(payload);
    revalidatePath("/", "layout");
    revalidatePath("/objetivos");
    revalidatePath("/transacoes");
    return { ok: true, mensagem: `Entrada registrada em ${resultado.contaNome}.` };
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : "Não foi possível registrar a entrada." };
  }
}
