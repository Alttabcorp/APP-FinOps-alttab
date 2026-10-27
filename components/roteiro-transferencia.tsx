"use client";

import { useState } from "react";
import Link from "next/link";
import type { LinhaTransferencia } from "@/lib/domain/financeiro/transferencia";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  linhas: LinhaTransferencia[];
};

export function RoteiroTransferencia({ linhas }: Props) {
  const [copiada, setCopiada] = useState("");

  const copiar = async (linha: LinhaTransferencia) => {
    if (!linha.chavePix) return;
    try {
      await navigator.clipboard.writeText(linha.chavePix);
      setCopiada(linha.id);
      window.setTimeout(() => setCopiada((atual) => (atual === linha.id ? "" : atual)), 1600);
    } catch {
      setCopiada("");
    }
  };

  if (linhas.length === 0) return null;

  return (
    <section className="mt-6" aria-labelledby="roteiro-titulo">
      <h2 id="roteiro-titulo" className="titulo-secao">
        Transferir neste mês
      </h2>
      <p className="mt-1 max-w-[46ch] text-sm text-mute">
        O PIX é no app do banco. Copiar a chave não marca pago nem altera saldo.
      </p>
      <ul className="roteiro mt-3">
        {linhas.map((linha) => (
          <li key={linha.id}>
            <div className="min-w-0">
              <p className="money text-base">{formatarMoeda(linha.valor)}</p>
              <p className="mt-0.5 text-sm">
                {linha.rotulo}
                {linha.destino && linha.destino !== linha.rotulo ? ` · ${linha.destino}` : ""}
              </p>
              {linha.banco || linha.titular ? (
                <p className="text-xs text-mute">{[linha.banco, linha.titular].filter(Boolean).join(" · ")}</p>
              ) : null}
            </div>
            {linha.chavePix ? (
              <button className="btn shrink-0 text-sm" type="button" onClick={() => copiar(linha)}>
                {copiada === linha.id ? "Copiada" : "Copiar chave"}
              </button>
            ) : (
              <Link className="shrink-0 text-sm text-mute underline" href="/cadastros">
                Cadastrar chave
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
