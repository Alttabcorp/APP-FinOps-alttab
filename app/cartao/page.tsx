import { notFound } from "next/navigation";
import { PainelCartaoPagina } from "@/components/painel-cartao-pagina";
import { listarComprasCartao, listarRecorrentesCartao } from "@/lib/application/cartao-service";
import { carregarFolha } from "@/lib/application/carregar-folha";
import {
  competenciaDaFaturaHoje,
  listarLancamentos,
  obterDiaFechamentoCartao,
  obterDiaPagamentoCartao,
} from "@/lib/application/lancamento-service";
import { isCompetencia } from "@/lib/domain/financeiro/competencia";
import { isAbaCartao, type AbaCartao } from "@/lib/ui/abas";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ mes?: string; aba?: string }> };

export default async function PaginaCartao({ searchParams }: Props) {
  const { mes, aba } = await searchParams;
  const abaInicial: AbaCartao = isAbaCartao(aba) ? aba : "avulsos";
  // Sem ?mes=, abre a fatura que está recebendo as compras de agora (após o fechamento).
  const faturaHoje = await competenciaDaFaturaHoje();
  const competencia = mes && isCompetencia(mes) ? mes : faturaHoje;
  const folha = await carregarFolha(competencia);
  if (!folha) notFound();

  const competenciasLista = [...new Set([competencia, faturaHoje])];
  const [compras, recorrentes, lancamentos, diaFechamento, diaPagamento] = await Promise.all([
    listarComprasCartao(),
    listarRecorrentesCartao(),
    listarLancamentos(competenciasLista),
    obterDiaFechamentoCartao(),
    obterDiaPagamentoCartao(),
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
        diaPagamento={diaPagamento}
        abaInicial={abaInicial}
        avulsosFaturaAberta={avulsosFaturaAberta.map((item) => ({
          id: item.id,
          descricao: item.descricao,
          valor: item.valor,
        }))}
      />
    </main>
  );
}
