"use server";

import { revalidatePath } from "next/cache";
import { mesParaDto, type MesDTO } from "@/lib/application/mes-mapper";
import {
  criarProximoMes,
  definirMesFechado,
  obterOuCriarMes,
  salvarMes,
  trazerValoresMesAnterior,
} from "@/lib/application/mes-service";

export type AcaoMesResultado =
  | { ok: true; mes: MesDTO; criado?: boolean }
  | { ok: false; erro: string };

const falha = (erro: unknown, fallback: string): AcaoMesResultado => ({
  ok: false,
  erro: erro instanceof Error ? erro.message : fallback,
});

const revalidarMes = (competencia: string) => {
  revalidatePath(`/meses/${competencia}`);
  revalidatePath("/entradas");
  revalidatePath("/gastos");
  revalidatePath("/investimentos");
  revalidatePath("/historico");
  revalidatePath("/");
};

export async function salvarMesAction(payload: MesDTO): Promise<AcaoMesResultado> {
  try {
    const mes = await salvarMes(payload);
    revalidarMes(payload.competencia);
    return { ok: true, mes: mesParaDto(mes) };
  } catch (erro) {
    return falha(erro, "Não foi possível salvar o mês.");
  }
}

export async function criarProximoMesAction(
  atual: string,
  copiarValoresDe?: string[],
): Promise<AcaoMesResultado> {
  try {
    const { mes, criado } = await criarProximoMes(atual, copiarValoresDe);
    revalidarMes(mes.competencia);
    return { ok: true, mes, criado };
  } catch (erro) {
    return falha(erro, "Não foi possível criar o próximo mês.");
  }
}

export async function trazerValoresMesAnteriorAction(
  competencia: string,
  copiarValoresDe: string[],
): Promise<AcaoMesResultado> {
  try {
    const mes = await trazerValoresMesAnterior(competencia, copiarValoresDe);
    revalidarMes(competencia);
    return { ok: true, mes: mesParaDto(mes) };
  } catch (erro) {
    return falha(erro, "Não foi possível trazer os valores do mês anterior.");
  }
}

export async function definirMesFechadoAction(
  competencia: string,
  fechado: boolean,
): Promise<AcaoMesResultado> {
  try {
    const mes = await definirMesFechado(competencia, fechado);
    revalidarMes(competencia);
    return { ok: true, mes: mesParaDto(mes) };
  } catch (erro) {
    return falha(erro, fechado ? "Não foi possível fechar o mês." : "Não foi possível reabrir o mês.");
  }
}

export async function garantirMesAction(competencia: string): Promise<AcaoMesResultado> {
  try {
    const mes = await obterOuCriarMes(competencia);
    return { ok: true, mes: mesParaDto(mes) };
  } catch (erro) {
    return falha(erro, "Não foi possível abrir o mês.");
  }
}
