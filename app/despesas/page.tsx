import { notFound } from "next/navigation";
import { PainelDespesas } from "@/components/painel-despesas";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { listarContasAnuais } from "@/lib/application/anual-service";
import { listarComprasCartao, listarRecorrentesCartao } from "@/lib/application/cartao-service";
import {
  competenciaDaFaturaHoje,
  isCategoriaVariavel,
  listarLancamentos,
  obterDiaFechamentoCartao,
} from "@/lib/application/lancamento-service";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ mes?: string; add?: string }> };

export default async function PaginaDespesas({ searchParams }: Props) {
  const { mes, add } = await searchParams;
  const competencia = mes && isCompetencia(mes) ? mes : competenciaAtual();
  const folha = await carregarFolha(competencia);
  if (!folha) notFound();

  const faturaHoje = await competenciaDaFaturaHoje();
  const [lancamentos, contasAnuais, compras, recorrentes, diaFechamento] = await Promise.all([
    listarLancamentos([...new Set([competencia, faturaHoje])]),
    listarContasAnuais(),
    listarComprasCartao(),
    listarRecorrentesCartao(),
    obterDiaFechamentoCartao(),
  ]);
  const { resultado, dto } = folha;
  const inv = resultado.investimentos;

  return (
    <main id="conteudo">
      <PainelDespesas
        competencia={competencia}
        mesInicial={dto}
        ganhou={resultado.resumo.ganhou}
        gasto={resultado.resumo.gasto}
        sobrou={resultado.resumo.sobrou}
        cartaoParcelas={folha.faturaCartao}
        cartaoFixo={folha.cartaoFixo}
        sugestoes={{
          feira: resultado.despesasVariaveis.feira.sugestao,
          gasolina: resultado.despesasVariaveis.gasolina.sugestao,
        }}
        lancamentos={lancamentos}
        contasAnuais={contasAnuais}
        compras={compras}
        recorrentes={recorrentes}
        faturaHoje={faturaHoje}
        diaFechamento={diaFechamento}
        tetoCartao={resultado.despesasVariaveis.cartao.teto}
        abrirCategoria={isCategoriaVariavel(add) ? add : null}
        aportes={[
          { campo: "poupanca", rotulo: "Poupança", valor: inv.poupanca.real, sugestao: inv.poupanca.sugestao },
          { campo: "fundo", rotulo: "Fundo imobiliário", valor: inv.fundo.real, sugestao: inv.fundo.sugestao },
          { campo: "alttab", rotulo: "Alttab", valor: inv.alttab.real, sugestao: inv.alttab.sugestao },
        ]}
      />
    </main>
  );
}
