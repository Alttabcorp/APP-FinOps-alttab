import { PainelLancamentoGastos } from "@/components/painel-lancamento-gastos";
import { carregarGastos } from "@/lib/application/carregar-gastos";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ mes?: string }>;
};

export default async function PaginaGastos({ searchParams }: Props) {
  const { mes } = await searchParams;
  const dados = await carregarGastos(mes);
  if (!dados) {
    return (
      <main id="conteudo" className="pagina">
        <h1 className="titulo">Contas que se repetem</h1>
        <p className="pagina-nota">Não foi possível abrir o mês atual.</p>
      </main>
    );
  }

  return (
    <main id="conteudo" className="pagina">
      <PainelLancamentoGastos dados={dados} />
    </main>
  );
}
