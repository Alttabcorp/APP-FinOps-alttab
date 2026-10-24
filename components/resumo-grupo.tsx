"use client";

import type { ItemDTO } from "@/lib/application/mes-mapper";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  titulo: string;
  itens: ItemDTO[];
  tom?: "inflow" | "outflow" | "accent";
  acao: string;
  onEditar: () => void;
  somenteLeitura?: boolean;
};

export function ResumoGrupo({ titulo, itens, tom = "accent", acao, onEditar, somenteLeitura = false }: Props) {
  const total = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
  const visiveis = itens.filter((item) => Math.abs(Number(item.valor) || 0) > 0.005);
  const painel = tom === "inflow" ? "panel-inflow" : tom === "outflow" ? "panel-outflow" : "panel-accent";

  return (
    <section className={`panel ${painel} flex flex-col p-5`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">{titulo}</h3>
          <p className="money mt-1 text-xl font-semibold">{formatarMoeda(total)}</p>
        </div>
        {somenteLeitura ? null : (
          <button className="btn shrink-0 text-sm" type="button" onClick={onEditar}>
            {acao}
          </button>
        )}
      </header>
      {visiveis.length === 0 ? (
        <p className="mt-4 text-sm text-mute">Nada preenchido neste grupo.</p>
      ) : (
        <ul className="mt-3">
          {visiveis.map((item, indice) => (
            <li
              key={`${item.nome}-${indice}`}
              className="flex items-baseline justify-between gap-3 border-t border-line py-2 text-sm"
            >
              <span className="min-w-0 truncate">{item.nome || "Sem nome"}</span>
              <span className="money shrink-0">{formatarMoeda(item.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
