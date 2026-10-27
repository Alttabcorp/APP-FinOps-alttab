import { classificarNomeGasto, type CategoriaGasto } from "./gasto";

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

const TIPOS_CONTA = new Set(["CONTA", "EXTRA_MES", "ANUAL"]);

export type LinhaAcompanhar = {
  competencia: string;
  salario: number;
  ganhou: number;
  gasto: number;
  sobrou: number;
  cartao: number;
  agua: number;
  energia: number;
  poupanca: number;
  fundo: number;
  alttab: number;
  investido: number;
  paraMeta: number;
  fechado: boolean;
};

export type ChaveAcompanhar = Exclude<keyof LinhaAcompanhar, "competencia" | "fechado">;

export type PicoMes = {
  competencia: string;
  valor: number;
};

export type ComparativoMes = {
  atual: PicoMes;
  anterior: PicoMes;
  delta: number;
};

export function somarContaClassificada(
  itens: { tipo: string; nome: string; valor: number }[],
  categoria: CategoriaGasto,
) {
  return round2(
    itens.reduce((acc, item) => {
      if (!TIPOS_CONTA.has(item.tipo)) return acc;
      if (classificarNomeGasto(item.nome) !== categoria) return acc;
      return acc + (Number(item.valor) || 0);
    }, 0),
  );
}

export function mesDoMaior(linhas: LinhaAcompanhar[], chave: ChaveAcompanhar): PicoMes | null {
  if (linhas.length === 0) return null;
  let melhor = linhas[0];
  for (const linha of linhas) {
    if (linha[chave] > melhor[chave] + 0.005) melhor = linha;
  }
  if (melhor[chave] < 0.005) return null;
  return { competencia: melhor.competencia, valor: melhor[chave] };
}

export function compararComAnterior(
  linhas: LinhaAcompanhar[],
  chave: ChaveAcompanhar,
): ComparativoMes | null {
  if (linhas.length < 2) return null;
  const atual = linhas[linhas.length - 1];
  const anterior = linhas[linhas.length - 2];
  return {
    atual: { competencia: atual.competencia, valor: atual[chave] },
    anterior: { competencia: anterior.competencia, valor: anterior[chave] },
    delta: round2(atual[chave] - anterior[chave]),
  };
}

export function somaNoPeriodo(linhas: LinhaAcompanhar[], chave: ChaveAcompanhar) {
  return round2(linhas.reduce((acc, linha) => acc + linha[chave], 0));
}
