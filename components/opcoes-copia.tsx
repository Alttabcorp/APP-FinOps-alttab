"use client";

import { GRUPOS_COPIA } from "@/lib/domain/financeiro/copiar-mes";
import type { TipoItem } from "@/lib/domain/financeiro/tipos";

type Props = {
  nome: string;
  selecionados: TipoItem[];
  onChange: (tipos: TipoItem[]) => void;
};

export function OpcoesCopia({ nome, selecionados, onChange }: Props) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm">O que copiar</legend>
      {GRUPOS_COPIA.map((grupo) => {
        const id = `${nome}-${grupo.tipo}`;
        const marcado = selecionados.includes(grupo.tipo);
        return (
          <label key={grupo.tipo} className="flex cursor-pointer items-start gap-3 border border-line bg-sheet p-3" htmlFor={id}>
            <input
              id={id}
              className="checkbox mt-0.5"
              type="checkbox"
              name={id}
              checked={marcado}
              onChange={() => {
                onChange(
                  marcado ? selecionados.filter((tipo) => tipo !== grupo.tipo) : [...selecionados, grupo.tipo],
                );
              }}
            />
            <span>
              <span className="block text-sm">{grupo.rotulo}</span>
              <span className="block text-xs text-mute">{grupo.detalhe}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
