import { notFound } from "next/navigation";
import { PainelGanhos } from "@/components/painel-ganhos";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { garantirRendasPadrao, listarRendas } from "@/lib/application/renda-service";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ mes?: string }> };

export default async function PaginaGanhos({ searchParams }: Props) {
  const { mes } = await searchParams;
  const competencia = mes && isCompetencia(mes) ? mes : competenciaAtual();
  await garantirRendasPadrao();
  const [folha, fontes] = await Promise.all([carregarFolha(competencia), listarRendas()]);
  if (!folha) notFound();

  return (
    <main id="conteudo">
      <PainelGanhos
        competencia={competencia}
        mesInicial={folha.dto}
        sobrou={folha.resultado.resumo.sobrou}
        gasto={folha.resultado.resumo.gasto}
        fontes={fontes}
      />
    </main>
  );
}
