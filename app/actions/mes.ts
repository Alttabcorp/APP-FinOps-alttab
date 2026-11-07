"use server";

import { revalidatePath } from "next/cache";
import { mesParaDto, type MesDTO } from "@/lib/application/mes-mapper";
import {
  confirmarSobraAnterior,
  criarProximoMes,
  definirMesFechado,
  marcarDeposito,
  obterOuCriarMes,
  salvarMes,
  trazerValoresMesAnterior,
} from "@/lib/application/mes-service";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { isCampoMarca, montarRoteiroTransferencia, type CampoMarca } from "@/lib/domain/financeiro/transferencia";

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
  revalidatePath("/contas");
  revalidatePath("/gastos");
  revalidatePath("/cartao");
  revalidatePath("/investimentos");
  revalidatePath("/");
  revalidatePath("/objetivos");
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

export type AcaoDepositoResultado = { ok: true } | { ok: false; erro: string };

export async function marcarDepositoAction(
  competencia: string,
  campo: CampoMarca,
  depositado: boolean,
): Promise<AcaoDepositoResultado> {
  if (!isCampoMarca(campo)) return { ok: false, erro: "Depósito inválido." };
  try {
    let valor = 0;
    if (depositado && campo !== "cartao") {
      // O valor creditado é o mesmo que o roteiro de transferências mostra para este depósito.
      const folha = await carregarFolha(competencia);
      const linha = folha
        ? montarRoteiroTransferencia(folha.resultado, { contas: [], anuais: [], destinoCartao: null }).find(
            (item) => item.id === campo,
          )
        : null;
      valor = linha?.valor ?? 0;
    }
    await marcarDeposito(competencia, campo, depositado, valor);
    revalidarMes(competencia);
    return { ok: true };
  } catch (erro) {
    return {
      ok: false,
      erro: erro instanceof Error ? erro.message : "Não foi possível marcar o depósito.",
    };
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

export async function confirmarSobraAnteriorAction(
  competencia: string,
  valor: number,
): Promise<AcaoMesResultado> {
  try {
    const mes = await confirmarSobraAnterior(competencia, Number(valor));
    revalidarMes(competencia);
    return { ok: true, mes: mesParaDto(mes) };
  } catch (erro) {
    return falha(erro, "Não foi possível registrar a sobra.");
  }
}
