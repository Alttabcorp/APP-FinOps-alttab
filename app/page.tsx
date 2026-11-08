import { notFound } from "next/navigation";
import { PainelInicio } from "@/components/painel-inicio";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ mes?: string }> };

const nomeConta = (
  contas: { finalidade: string; nome: string; recebePoupanca?: boolean }[],
  finalidade: string,
  fallback: string,
) => {
  if (finalidade === "POUPANCA") {
    const marcada = contas.find((conta) => conta.recebePoupanca);
    if (marcada) return marcada.nome;
  }
  return contas.find((conta) => conta.finalidade === finalidade)?.nome ?? fallback;
};

export default async function PaginaInicial({ searchParams }: Props) {
  const { mes } = await searchParams;
  const competencia = mes && isCompetencia(mes) ? mes : competenciaAtual();
  const folha = await carregarFolha(competencia);
  if (!folha) notFound();

  const meta = folha.contas.find((conta) => conta.finalidade === "META" && conta.progresso.temMeta);
  const { resultado, dto } = folha;
  // Mesmo critério do roteiro de transferências: valor real; se vazio, a sugestão.
  const aporte = (par: { real: number; sugestao: number }) => (par.real > 0.005 ? par.real : par.sugestao);
  const fatura = folha.faturaCartao + folha.cartaoFixo + dto.cartaoReal;
  const contas = folha.contas;

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
        rotulos={{
          poupanca: nomeConta(contas, "POUPANCA", "Poupança"),
          reserva: nomeConta(contas, "RESERVA", "Reserva de emergência"),
          fundo: nomeConta(contas, "INVESTIMENTO", "Fundo imobiliário"),
          alttab: nomeConta(contas, "EMPRESA", "Empresa"),
          meta: nomeConta(contas, "META", "Objetivo"),
        }}
        sugestoes={{
          poupanca: resultado.investimentos.poupanca.sugestao,
          reserva: resultado.investimentos.reserva.sugestao,
          fundo: resultado.investimentos.fundo.sugestao,
          alttab: resultado.investimentos.alttab.sugestao,
          meta: resultado.investimentos.meta.sugestao,
        }}
        aportes={{
          poupanca: resultado.investimentos.poupanca.real,
          reserva: aporte(resultado.investimentos.reserva),
          fundo: aporte(resultado.investimentos.fundo),
          alttab: aporte(resultado.investimentos.alttab),
          meta: aporte(resultado.investimentos.meta),
        }}
        meta={
          meta
            ? { nome: meta.nome, saldo: meta.saldo, objetivo: meta.progresso.meta }
            : { nome: "Objetivo", saldo: 0, objetivo: 10000 }
        }
      />
    </main>
  );
}
