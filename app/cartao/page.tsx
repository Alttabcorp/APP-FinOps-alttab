import { notFound } from "next/navigation";
import { PainelCartaoPagina } from "@/components/painel-cartao-pagina";
import { listarComprasCartao, listarRecorrentesCartao } from "@/lib/application/cartao-service";
import { carregarFolha } from "@/lib/application/carregar-folha";
import {
  competenciaDaFaturaHoje,
  listarLancamentos,
  obterDiaFechamentoCartao,
} from "@/lib/application/lancamento-service";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ mes?: string }> };

export default async function PaginaCartao({ searchParams }: Props) {
  const { mes } = await searchParams;
  const competencia = mes && isCompetencia(mes) ? mes : competenciaAtual();
  const folha = await carregarFolha(competencia);
  if (!folha) notFound();

  const [compras, recorrentes, lancamentos, faturaHoje, diaFechamento] = await Promise.all([
    listarComprasCartao(),
    listarRecorrentesCartao(),
    listarLancamentos([competencia]),
    competenciaDaFaturaHoje(),
    obterDiaFechamentoCartao(),
  ]);
  const cartao = folha.resultado.despesasVariaveis.cartao;

  return (
    <main id="conteudo">
      <PainelCartaoPagina
        competencia={competencia}
        mes={folha.dto}
        teto={cartao.teto}
        compras={compras}
        recorrentes={recorrentes}
        lancamentos={lancamentos.filter((item) => item.categoria === "cartao")}
        faturaHoje={faturaHoje}
        diaFechamento={diaFechamento}
      />
    </main>
  );
}
