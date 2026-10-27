"use client";

import { progressoPagamento } from "@/lib/application/checklist";
import type { ItemDTO } from "@/lib/application/mes-mapper";
import type { ResultadoMes } from "@/lib/domain/financeiro/tipos";

type Acao = {
  id: string;
  rotulo: string;
  onClick: () => void;
};

type Props = {
  itens: ItemDTO[];
  resultado: ResultadoMes;
  feiraReal: number;
  cartaoReal: number;
  gasolinaReal: number;
  poupancaEditado: boolean;
  onIrPagar: () => void;
  onIrGastos: () => void;
  onEditarInvestimentos: () => void;
  onDevolverMeta?: () => void;
  fechado?: boolean;
};

export function FaixaFalta({
  itens,
  resultado,
  feiraReal,
  cartaoReal: _cartaoReal,
  gasolinaReal,
  poupancaEditado,
  onIrPagar,
  onIrGastos,
  onEditarInvestimentos,
  onDevolverMeta,
  fechado = false,
}: Props) {
  if (fechado) {
    return (
      <section className="border-y border-line py-3" aria-label="O que falta agora">
        <p className="text-sm text-inflow">Mês fechado. Os números não mudam até reabrir.</p>
      </section>
    );
  }

  const { total, pagas } = progressoPagamento(itens);
  const acoes: Acao[] = [];
  const faltam = total - pagas;
  if (faltam > 0) {
    acoes.push({
      id: "contas",
      rotulo: faltam === 1 ? "Falta 1 conta" : `Faltam ${faltam} contas`,
      onClick: onIrPagar,
    });
  }
  if (resultado.despesasVariaveis.cartao.estoura) {
    acoes.push({ id: "cartao", rotulo: "Fatura passa do teto", onClick: onIrGastos });
  } else if (resultado.prioridade.find((etapa) => etapa.id === "cartao")?.status === "falta") {
    acoes.push({ id: "cartao", rotulo: "Pagar o cartão", onClick: onIrGastos });
  }
  if (resultado.prioridade.find((etapa) => etapa.id === "poupanca")?.status === "falta") {
    acoes.push({ id: "poupanca", rotulo: "Poupança", onClick: onEditarInvestimentos });
  } else if (!poupancaEditado) {
    acoes.push({ id: "poupanca", rotulo: "Poupança ainda automática", onClick: onEditarInvestimentos });
  }
  if (resultado.despesasVariaveis.feira.sugestao > 0.005 && feiraReal < 0.005) {
    acoes.push({ id: "feira", rotulo: "Informar feira", onClick: onIrGastos });
  }
  if (resultado.prioridade.find((etapa) => etapa.id === "investimento")?.status === "falta") {
    acoes.push({ id: "investimento", rotulo: "Investimento", onClick: onEditarInvestimentos });
  }
  const reposicao = resultado.prioridade.find((etapa) => etapa.id === "reposicao");
  if (onDevolverMeta && reposicao && reposicao.precisa > 0.005) {
    acoes.push({
      id: "reposicao",
      rotulo: reposicao.status === "falta" ? "Repor a retirada" : "Repor o que saiu",
      onClick: onDevolverMeta,
    });
  }
  if (resultado.despesasVariaveis.gasolina.sugestao > 0.005 && gasolinaReal < 0.005) {
    acoes.push({ id: "gasolina", rotulo: "Informar gasolina", onClick: onIrGastos });
  }

  return (
    <section className="border-y border-line py-3" aria-label="O que falta agora">
      {acoes.length === 0 ? (
        <p className="text-sm text-inflow">Mês em dia.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {acoes.map((acao) => (
            <li key={acao.id}>
              <button className="btn text-sm" type="button" onClick={acao.onClick}>
                {acao.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
