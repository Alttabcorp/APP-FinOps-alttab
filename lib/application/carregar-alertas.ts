import { carregarFolha } from "@/lib/application/carregar-folha";
import { alertasDoMes, type AlertaMes } from "@/lib/domain/financeiro/alertas";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

export async function carregarAlertas(competencia?: string | null): Promise<{
  competencia: string;
  alertas: AlertaMes[];
  regras: {
    poupanca10: number;
    tetoCartao: number;
    gastoIndividual: number;
    paraMeta: number;
    sobrou: number;
  } | null;
}> {
  const alvo = competencia && isCompetencia(competencia) ? competencia : competenciaAtual();
  const folha = await carregarFolha(alvo);
  if (!folha) {
    return { competencia: alvo, alertas: [], regras: null };
  }

  const alertas = alertasDoMes({
    competencia: alvo,
    resultado: folha.resultado,
    parcelas: folha.parcelasCartao,
  });

  return {
    competencia: alvo,
    alertas,
    regras: {
      poupanca10: folha.resultado.investimentos.poupanca.sugestao,
      tetoCartao: folha.resultado.despesasVariaveis.cartao.teto,
      gastoIndividual: folha.resultado.distribuicao.gastoPessoal,
      paraMeta: folha.resultado.resumo.sobrou < -0.005 ? 0 : folha.resultado.distribuicao.metaFinal,
      sobrou: folha.resultado.resumo.sobrou,
    },
  };
}
