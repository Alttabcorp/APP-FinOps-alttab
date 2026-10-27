import { CabecaPagina } from "@/components/cabeca-pagina";
import { NavCadastros } from "@/components/nav-cadastros";
import { PainelCartao } from "@/components/painel-cartao";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { listarComprasCartao, listarRecorrentesCartao } from "@/lib/application/cartao-service";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function PaginaCartao({ searchParams }: Props) {
  const { novo } = await searchParams;
  const [compras, recorrentes, folha] = await Promise.all([
    listarComprasCartao(),
    listarRecorrentesCartao(),
    carregarFolha(competenciaAtual()),
  ]);

  return (
    <main id="conteudo" className="pagina">
      <NavCadastros />
      <CabecaPagina
        titulo="Cartão"
        nota="Gasto fixo e parcelas entram na fatura. O teto é o que sobra depois das contas."
      />
      <div className="mt-6">
        <PainelCartao
          compras={compras}
          recorrentes={recorrentes}
          teto={folha?.resultado.despesasVariaveis.cartao.teto ?? 0}
          abrirNovo={novo === "1"}
          abrirFixo={novo === "fixo"}
        />
      </div>
    </main>
  );
}
