"use client";

import { useId, type ReactNode } from "react";

export type AbaItem = {
  id: string;
  rotulo: string;
  painel: ReactNode;
};

type Props = {
  abas: AbaItem[];
  ativa: string;
  onChange: (id: string) => void;
  /** Rótulo acessível do conjunto de abas. */
  rotulo?: string;
};

export function AbasSecao({ abas, ativa, onChange, rotulo = "Seções" }: Props) {
  const baseId = useId();
  const atual = abas.some((aba) => aba.id === ativa) ? ativa : abas[0]?.id;
  const ativaItem = abas.find((aba) => aba.id === atual) ?? abas[0];

  if (!ativaItem) return null;

  return (
    <div className="abas-secao">
      <div className="abas-secao-lista" role="tablist" aria-label={rotulo}>
        {abas.map((aba) => {
          const selecionada = aba.id === atual;
          return (
            <button
              key={aba.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${aba.id}`}
              className={`aba ${selecionada ? "is-ativa" : ""}`}
              aria-selected={selecionada}
              aria-controls={`${baseId}-painel-${aba.id}`}
              tabIndex={selecionada ? 0 : -1}
              onClick={() => onChange(aba.id)}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-painel-${ativaItem.id}`}
        aria-labelledby={`${baseId}-tab-${ativaItem.id}`}
        className="abas-secao-painel"
      >
        {ativaItem.painel}
      </div>
    </div>
  );
}
