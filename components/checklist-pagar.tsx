"use client";

import Link from "next/link";
import { ehAPagar } from "@/lib/application/checklist";
import type { ItemDTO } from "@/lib/application/mes-mapper";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  itens: ItemDTO[];
  onToggle: (indice: number, pago: boolean) => void;
  onEditarContas: () => void;
  onEditarExtraMes: () => void;
  somenteLeitura?: boolean;
};

export function ChecklistPagar({
  itens,
  onToggle,
  onEditarContas,
  onEditarExtraMes,
  somenteLeitura = false,
}: Props) {
  const linhas = itens
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => ehAPagar(item.tipo))
    .sort((a, b) => {
      const aZero = Math.abs(a.item.valor) < 0.005 ? 1 : 0;
      const bZero = Math.abs(b.item.valor) < 0.005 ? 1 : 0;
      return aZero - bZero;
    });
  const total = linhas.length;
  const pagas = linhas.filter(({ item }) => item.pago).length;
  const aberto = linhas
    .filter(({ item }) => !item.pago)
    .reduce((acc, { item }) => acc + (Number(item.valor) || 0), 0);

  return (
    <section id="checklist-pagar" className="panel panel-outflow p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Contas do mês</h3>
          <p className="mt-1 text-sm text-mute">
            {total === 0
              ? "Nenhuma conta neste mês."
              : `${pagas} de ${total} ${total === 1 ? "paga" : "pagas"}`}
            {aberto > 0 ? `. Em aberto ${formatarMoeda(aberto)}` : null}
          </p>
        </div>
        {somenteLeitura ? null : (
          <div className="flex flex-wrap gap-2">
            <button className="btn text-sm" type="button" onClick={onEditarContas}>
              Editar contas
            </button>
            <button className="btn text-sm" type="button" onClick={onEditarExtraMes}>
              Editar extra do mês
            </button>
            <Link className="btn text-sm" href="/anuais">
              Contas anuais
            </Link>
          </div>
        )}
      </header>

      {linhas.length === 0 ? (
        <p className="mt-4 text-sm text-mute">
          Adicione contas fixas ou um extra do mês para marcar o que já pagou.
        </p>
      ) : (
        <ul className="mt-2">
          {linhas.map(({ item, indice }) => {
            const id = `pago-${item.tipo}-${indice}`;
            const zerado = Math.abs(item.valor) < 0.005;
            return (
              <li key={id} className="border-b border-line last:border-b-0">
                <label
                  htmlFor={id}
                  className={`flex items-center gap-3 py-3 ${somenteLeitura ? "" : "cursor-pointer"} ${
                    item.pago ? "text-mute" : ""
                  }`}
                >
                  <input
                    id={id}
                    className="checkbox-pago shrink-0"
                    type="checkbox"
                    name={id}
                    checked={item.pago}
                    disabled={somenteLeitura}
                    onChange={(evento) => onToggle(indice, evento.target.checked)}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    <span className={item.pago ? "line-through" : ""}>{item.nome || "Sem nome"}</span>
                    {item.tipo === "EXTRA_MES" ? (
                      <span className="ml-2 text-xs text-mute no-underline">extra do mês</span>
                    ) : null}
                    {item.tipo === "ANUAL" ? (
                      <span className="ml-2 text-xs text-mute no-underline">anual</span>
                    ) : null}
                    {item.pago ? <span className="selo-pago ml-2 align-middle">pago</span> : null}
                  </span>
                  <span className={`money shrink-0 text-sm ${zerado || item.pago ? "text-mute" : ""}`}>
                    {formatarMoeda(item.valor)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
