import { PainelInvestimentos } from "@/components/painel-investimentos";
import { carregarInvestimentos } from "@/lib/application/carregar-investimentos";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ novo?: string; mes?: string }>;
};

export default async function PaginaInvestimentos({ searchParams }: Props) {
  const { novo, mes } = await searchParams;
  const dados = await carregarInvestimentos(mes);
  if (!dados) {
    return (
      <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 lg:px-8">
        <h1 className="titulo">Investimentos</h1>
        <p className="mt-3 text-sm text-mute">Não foi possível abrir o mês atual.</p>
      </main>
    );
  }

  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <header>
        <h1 className="titulo">Investimentos</h1>
        <p className="mt-2 max-w-[42ch] text-sm text-mute">
          Ajuste o aporte do mês, compare o histórico e veja onde o dinheiro fica. Objetivo: R$ 1.000 por mês de
          renda passiva.
        </p>
      </header>
      <div className="mt-6">
        <PainelInvestimentos
          mesInicial={dados.dto}
          faturaCartao={dados.faturaCartao}
          contas={dados.contas}
          historico={dados.historico}
          abrirNovo={novo}
        />
      </div>
    </main>
  );
}
