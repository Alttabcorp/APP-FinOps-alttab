import { notFound } from "next/navigation";
import type { AbaFolha } from "@/components/abas-folha";
import { FolhaMes } from "@/components/folha-mes";
import { carregarFolha } from "@/lib/application/carregar-folha";

export async function PaginaFolhaMes({
  competencia,
  aba,
}: {
  competencia: string;
  aba: AbaFolha;
}) {
  const folha = await carregarFolha(competencia);
  if (!folha) notFound();

  return (
    <main id="conteudo">
      <FolhaMes
        aba={aba}
        mesInicial={folha.dto}
        resultadoInicial={folha.resultado}
        resumoAnterior={folha.resumoAnterior}
        parcelasCartao={folha.parcelasCartao}
        faturaCartao={folha.faturaCartao}
        gastoPessoalMes={folha.gastoPessoalMes}
        reposicaoMeta={folha.reposicaoMeta}
      />
    </main>
  );
}
