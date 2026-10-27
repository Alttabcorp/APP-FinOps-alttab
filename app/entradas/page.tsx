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
      <main id="conteudo" className="pagina">
        <h1 className="titulo">Fontes</h1>
        <p className="pagina-nota">Não foi possível abrir o mês atual.</p>
      </main>
    );
  }

  return (
    <main id="conteudo">
      <PainelEntradas dados={dados} abrirNovo={novo} />
    </main>
  );
}
