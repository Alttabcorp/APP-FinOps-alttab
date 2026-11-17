import { notFound } from "next/navigation";
import { PainelCartaoPagina } from "@/components/painel-cartao-pagina";
import { listarComprasCartao, listarRecorrentesCartao } from "@/lib/application/cartao-service";
import { carregarFolha } from "@/lib/application/carregar-folha";
import {
  competenciaDaFaturaHoje,
  listarLancamentos,
  obterDiaFechamentoCartao,
} from "@/lib/application/lancamento-service";
import { isCompetencia } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ mes?: string }> };

export default async function PaginaCartao({ searchParams }: Props) {
  const { mes } = await searchParams;
  // Sem ?mes=, abre a fatura que está recebendo as compras de agora (após o fechamento).
  const faturaHoje = await competenciaDaFaturaHoje();
  const competencia = mes && isCompetencia(mes) ? mes : faturaHoje;
  const folha = await carregarFolha(competencia);
  if (!folha) notFound();

  const competenciasLista = [...new Set([competencia, faturaHoje])];
  const [compras, recorrentes, lancamentos, diaFechamento] = await Promise.all([
    listarComprasCartao(),
    listarRecorrentesCartao(),
    listarLancamentos(competenciasLista),
    obterDiaFechamentoCartao(),
  ]);
  const cartao = folha.resultado.despesasVariaveis.cartao;
  const avulsosDestaFatura = lancamentos.filter(
    (item) => item.categoria === "cartao" && item.competencia === competencia,
  );
  const avulsosFaturaAberta =
    faturaHoje === competencia
      ? []
      : lancamentos.filter((item) => item.categoria === "cartao" && item.competencia === faturaHoje);

  return (
    <main id="conteudo">
      <PainelCartaoPagina
        competencia={competencia}
        mes={folha.dto}
        teto={cartao.teto}
        compras={compras}
        recorrentes={recorrentes}
        lancamentos={avulsosDestaFatura}
        faturaHoje={faturaHoje}
        diaFechamento={diaFechamento}
        avulsosFaturaAberta={avulsosFaturaAberta.map((item) => ({
          id: item.id,
          descricao: item.descricao,
          valor: item.valor,
        }))}
      />
    </main>
  );
}
