import { notFound } from "next/navigation";
import { PainelInicio } from "@/components/painel-inicio";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ mes?: string }> };

export default async function PaginaInicial({ searchParams }: Props) {
  const { mes } = await searchParams;
  const competencia = mes && isCompetencia(mes) ? mes : competenciaAtual();
  const folha = await carregarFolha(competencia);
  if (!folha) notFound();

  const meta = folha.contas.find((conta) => conta.finalidade === "META" && conta.progresso.temMeta);
  const { resultado, dto } = folha;
  const fatura =
    folha.faturaCartao + folha.cartaoFixo + dto.cartaoReal + (folha.faturaAvulsosCompra ?? 0);

  return (
    <main id="conteudo">
      <PainelInicio
        competencia={competencia}
        mes={dto}
        ganhou={resultado.resumo.ganhou}
        gasto={resultado.resumo.gasto}
        gastoContas={resultado.gastoMensal}
        sobrou={resultado.resumo.sobrou}
        tetoCartao={resultado.despesasVariaveis.cartao.teto}
        faturaCartao={fatura}
        poupancaSugerida={resultado.investimentos.poupanca.sugestao}
        contas={folha.contas.map((conta) => ({ id: conta.id, nome: conta.nome }))}
        meta={
          meta
            ? { nome: meta.nome, saldo: meta.saldo, objetivo: meta.progresso.meta }
            : { nome: "Objetivo", saldo: 0, objetivo: 10000 }
        }
      />
    </main>
  );
}
