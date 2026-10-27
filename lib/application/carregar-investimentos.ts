import { carregarFolha } from "@/lib/application/carregar-folha";
import { montarMetas } from "@/lib/application/dashboard-visao";
import { mesParaDto } from "@/lib/application/mes-mapper";
import { listarMesesRecentes } from "@/lib/application/mes-service";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

export async function carregarInvestimentos(competenciaPedido?: string) {
  const competencia = competenciaPedido && isCompetencia(competenciaPedido) ? competenciaPedido : competenciaAtual();
  const [folha, meses] = await Promise.all([carregarFolha(competencia), listarMesesRecentes(8)]);
  if (!folha) return null;

  const contas = folha.contas.filter(
    (conta) => conta.finalidade === "INVESTIMENTO" || conta.finalidade === "POUPANCA",
  );
  const historico = meses.map((mes) => {
    const dto = mesParaDto(mes);
    return {
      competencia: mes.competencia,
      fundo: dto.fundoReal,
      alttab: dto.alttabReal,
      poupanca: dto.poupancaReal,
      total: dto.fundoReal + dto.alttabReal + dto.poupancaReal,
    };
  });

  return {
    competencia,
    dto: folha.dto,
    faturaCartao: folha.faturaCartao,
    contas,
    historico,
    metas: montarMetas({
      contas: folha.contas,
      resultado: folha.resultado,
      metaRendimentoPassivo: folha.metaRendimentoPassivo,
      emprestimosMeta: folha.emprestimosMeta,
    }),
    gastoPessoalMes: folha.gastoPessoalMes,
    reposicaoMeta: folha.reposicaoMeta,
    cartaoFixo: folha.cartaoFixo,
    emprestimosPoupanca: folha.emprestimosMeta.filter((emprestimo) => emprestimo.contaFinalidade === "POUPANCA"),
    sobraMes: folha.resultado.distribuicao.metaFinal,
  };
}
