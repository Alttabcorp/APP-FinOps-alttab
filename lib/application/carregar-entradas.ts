import { carregarFolha } from "@/lib/application/carregar-folha";
import { mesParaDto } from "@/lib/application/mes-mapper";
import { listarMesesRecentes } from "@/lib/application/mes-service";
import { listarRendas, obterPreferenciaCasa } from "@/lib/application/renda-service";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

const somarTipo = (itens: { tipo: string; valor: number }[], tipo: string) =>
  itens.filter((item) => item.tipo === tipo).reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

export async function carregarEntradas(competenciaPedido?: string) {
  const competencia = competenciaPedido && isCompetencia(competenciaPedido) ? competenciaPedido : competenciaAtual();
  const [folha, rendas, preferencia, meses] = await Promise.all([
    carregarFolha(competencia),
    listarRendas(),
    obterPreferenciaCasa(),
    listarMesesRecentes(8),
  ]);
  if (!folha) return null;

  const historico = meses.map((mes) => {
    const dto = mesParaDto(mes);
    const dinheiro = somarTipo(dto.itens, "SALDO");
    const valesRendimento = somarTipo(dto.itens, "EXTRA");
    return {
      competencia: mes.competencia,
      dinheiro,
      valesRendimento,
      total: dinheiro + valesRendimento,
    };
  });

  return {
    competencia,
    dto: folha.dto,
    resultado: folha.resultado,
    faturaCartao: folha.faturaCartao,
    gastoPessoalMes: folha.gastoPessoalMes,
    reposicaoMeta: folha.reposicaoMeta,
    rendas,
    metaRendimentoPassivo: preferencia.metaRendimentoPassivo,
    historico,
  };
}
