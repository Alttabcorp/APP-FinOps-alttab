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
      <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 lg:px-8">
        <h1 className="titulo">Gastos</h1>
        <p className="mt-3 text-sm text-mute">Não foi possível abrir o mês atual.</p>
      </main>
    );
  }

  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <PainelLancamentoGastos dados={dados} />
    </main>
  );
}
