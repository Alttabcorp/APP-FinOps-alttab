import { PainelEntradas } from "@/components/painel-entradas";
import { carregarEntradas } from "@/lib/application/carregar-entradas";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ novo?: string; mes?: string }>;
};

export default async function PaginaEntradas({ searchParams }: Props) {
  const { novo, mes } = await searchParams;
  const dados = await carregarEntradas(mes);
  if (!dados) {
    return (
      <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 lg:px-8">
        <h1 className="titulo">Entradas</h1>
        <p className="mt-3 text-sm text-mute">Não foi possível abrir o mês atual.</p>
      </main>
    );
  }

  return (
    <main id="conteudo">
      <PainelEntradas dados={dados} abrirNovo={novo} />
    </main>
  );
}
