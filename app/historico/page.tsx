import { PainelHistorico } from "@/components/painel-historico";
import { listarResumos } from "@/lib/application/mes-service";

export const dynamic = "force-dynamic";

export default async function PaginaHistorico() {
  const resumos = await listarResumos();

  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <header>
        <h1 className="titulo">
          Histórico
        </h1>
        <p className="mt-2 max-w-[42ch] text-sm text-mute">
          Compare meses. Rascunho ainda pode mudar; fechado entra como histórico.
        </p>
      </header>
      <PainelHistorico resumos={resumos} />
    </main>
  );
}
