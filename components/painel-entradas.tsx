"use client";

import Link from "next/link";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { NavCadastros } from "@/components/nav-cadastros";
import { PainelRendas } from "@/components/painel-rendas";
import type { carregarEntradas } from "@/lib/application/carregar-entradas";

type Dados = NonNullable<Awaited<ReturnType<typeof carregarEntradas>>>;

type Props = {
  dados: Dados;
  abrirNovo?: string | null;
};

export function PainelEntradas({ dados, abrirNovo = null }: Props) {
  return (
    <article className="pagina">
      <NavCadastros />
      <CabecaPagina
        titulo="Fontes"
        nota={
          <>
            Emprego, bico e rendimento. O valor do mês se lança no{" "}
            <Link className="underline" href="/">Início</Link>.
          </>
        }
      />
      <PainelRendas rendas={dados.rendas} abrirNovo={abrirNovo} />
    </article>
  );
}
