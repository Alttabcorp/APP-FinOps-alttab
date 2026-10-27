import { PainelDashboard } from "@/components/painel-dashboard";
import { carregarDashboard } from "@/lib/application/carregar-dashboard";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ mes?: string }>;
};

export default async function PaginaInicial({ searchParams }: Props) {
  const { mes } = await searchParams;
  const dados = await carregarDashboard(mes);
  if (!dados) {
    return (
      <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 lg:px-8">
        <h1 className="titulo">Início</h1>
        <p className="mt-3 text-sm text-mute">Não foi possível abrir o mês atual.</p>
      </main>
    );
  }

  return (
    <main id="conteudo">
      <PainelDashboard dados={dados} />
    </main>
  );
}
