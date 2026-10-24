"use client";

import { useState } from "react";
import type { PapelExtra, TipoItem } from "@prisma/client";
import type { ItemDTO } from "@/lib/application/mes-mapper";
import { CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { formatarMoeda } from "@/lib/formatacao";

const PAPEIS: { valor: PapelExtra; rotulo: string }[] = [
  { valor: "VALE_TRANSPORTE", rotulo: "Vale-transporte" },
  { valor: "VALE_ALIMENTACAO", rotulo: "Vale-alimentação" },
  { valor: "PROVENTO_FUNDO", rotulo: "Rendimento do investimento" },
  { valor: "PROVENTO_POUPANCA", rotulo: "Rendimento da poupança" },
  { valor: "OUTRO", rotulo: "Outro" },
];

type Props = {
  titulo: string;
  tipo: TipoItem;
  itens: ItemDTO[];
  onChange: (itens: ItemDTO[]) => void;
  comPapel?: boolean;
};

const novoItem = (tipo: TipoItem, ordem: number): ItemDTO => ({
  tipo,
  nome: "",
  valor: 0,
  papel: tipo === "EXTRA" ? "OUTRO" : null,
  ordem,
  pago: false,
});

export function ListaItens({ titulo, tipo, itens, onChange, comPapel = false }: Props) {
  const [confirmar, setConfirmar] = useState<number | null>(null);
  const atualizar = (indice: number, patch: Partial<ItemDTO>) => {
    onChange(itens.map((item, i) => (i === indice ? { ...item, ...patch } : item)));
  };
  const total = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  return (
    <div className="form-modal">
      <p className="form-resumo" aria-live="polite">
        {itens.length === 0
          ? "Nenhuma linha ainda."
          : `${itens.length} ${itens.length === 1 ? "linha" : "linhas"} · total ${formatarMoeda(total)}`}
      </p>
      <div className="form-campos">
      {itens.length === 0 ? (
        <p className="vazio">Nenhuma linha ainda. Adicione a primeira.</p>
      ) : (
        <ul className="grid gap-3">
          {itens.map((item, indice) => {
            const nomeId = `${tipo}-nome-${indice}`;
            const valorId = `${tipo}-valor-${indice}`;
            const papelId = `${tipo}-papel-${indice}`;
            return (
              <li key={`${tipo}-${indice}`} className="ficha">
                <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
                  <div className="grid min-w-0 gap-3">
                    <CampoTexto
                      id={nomeId}
                      label="Nome"
                      value={item.nome}
                      placeholder="Ex.: Energia…"
                      onChange={(nome) => atualizar(indice, { nome })}
                    />
                    {comPapel ? (
                      <CampoSelect
                        id={papelId}
                        label="Como entra no cálculo"
                        value={item.papel ?? "OUTRO"}
                        onChange={(papel) => atualizar(indice, { papel: papel as PapelExtra })}
                      >
                        {PAPEIS.map((papel) => (
                          <option key={papel.valor} value={papel.valor}>
                            {papel.rotulo}
                          </option>
                        ))}
                      </CampoSelect>
                    ) : null}
                  </div>
                  <CampoMoeda
                    id={valorId}
                    label="Valor"
                    name={valorId}
                    value={item.valor}
                    onChange={(valor) => atualizar(indice, { valor })}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  {confirmar === indice ? (
                    <div className="flex gap-2">
                      <button className="btn text-xs" type="button" onClick={() => setConfirmar(null)}>
                        Manter
                      </button>
                      <button
                        className="btn-danger text-xs"
                        type="button"
                        onClick={() => {
                          onChange(itens.filter((_, i) => i !== indice));
                          setConfirmar(null);
                        }}
                      >
                        Confirmar remoção
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-xs text-outflow hover:underline"
                      type="button"
                      onClick={() => setConfirmar(indice)}
                    >
                      Remover linha
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <button
        className="btn"
        type="button"
        onClick={() => {
          onChange([...itens, novoItem(tipo, itens.length)]);
          setConfirmar(null);
        }}
      >
        Adicionar linha em {titulo.toLowerCase()}
      </button>
      </div>
    </div>
  );
}
