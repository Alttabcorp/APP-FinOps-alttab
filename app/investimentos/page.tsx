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
      <main id="conteudo" className="pagina">
        <h1 className="titulo">Investimentos</h1>
        <p className="pagina-nota">Não foi possível abrir o mês atual.</p>
      </main>
    );
  }

  return (
    <main id="conteudo" className="pagina">
      <PainelInvestimentos
        mesInicial={dados.dto}
        faturaCartao={dados.faturaCartao}
        contas={dados.contas}
        historico={dados.historico}
        metas={dados.metas}
        gastoPessoalMes={dados.gastoPessoalMes}
        reposicaoMeta={dados.reposicaoMeta}
        cartaoFixo={dados.cartaoFixo}
        emprestimosPoupanca={dados.emprestimosPoupanca}
        abrirNovo={novo}
      />
    </main>
  );
}
