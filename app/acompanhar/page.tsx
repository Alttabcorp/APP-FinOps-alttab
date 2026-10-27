import { PainelAcompanhar } from "@/components/painel-acompanhar";
import { carregarAcompanhamento } from "@/lib/application/carregar-acompanhamento";

export const dynamic = "force-dynamic";

export default async function PaginaAcompanhar() {
  const dados = await carregarAcompanhamento();

  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <header>
        <h1 className="titulo">Acompanhar</h1>
        <p className="mt-2 max-w-[52ch] text-sm text-mute">
          Marquem o que já depositaram. Embaixo, o comparativo dos meses.
        </p>
      </header>
      <PainelAcompanhar
        linhas={dados.linhas}
        estoque={dados.estoque}
        mesAtual={dados.mesAtual}
        depositos={dados.depositos}
      />
    </main>
  );
}
