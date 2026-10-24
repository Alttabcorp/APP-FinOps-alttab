import { faturaCartaoNaCompetencia } from "@/lib/application/cartao-service";
import { listarContas } from "@/lib/application/conta-service";
import { listarEmprestimosMeta } from "@/lib/application/emprestimo-meta-service";
import { faturaDoMes } from "@/lib/domain/financeiro/cartao";
import { calcularMesPersistido, mesParaDto } from "@/lib/application/mes-mapper";
import { buscarMes, obterOuCriarMes } from "@/lib/application/mes-service";
import { obterPreferenciaCasa } from "@/lib/application/renda-service";
import { avancarCompetencia, isCompetencia } from "@/lib/domain/financeiro/competencia";
import { somarDevolucao } from "@/lib/domain/financeiro/emprestimo-meta";

export async function carregarFolha(competencia: string) {
  if (!isCompetencia(competencia)) return null;

  const mes = await obterOuCriarMes(competencia);
  const dto = mesParaDto(mes);
  const [contas, preferencia, fatura, mesAnterior, emprestimos] = await Promise.all([
    listarContas(),
    obterPreferenciaCasa(),
    faturaCartaoNaCompetencia(competencia),
    buscarMes(avancarCompetencia(competencia, -1)),
    listarEmprestimosMeta(competencia),
  ]);
  const reposicao = somarDevolucao(emprestimos, competencia);
  const resultado = calcularMesPersistido(mes, fatura.fatura, preferencia.gastoPessoalMes, reposicao);
  const resumoAnterior = mesAnterior
    ? {
        competencia: mesAnterior.competencia,
        sobrou: calcularMesPersistido(
          mesAnterior,
          faturaDoMes(fatura.compras, mesAnterior.competencia),
          preferencia.gastoPessoalMes,
          somarDevolucao(emprestimos, mesAnterior.competencia),
        ).resumo.sobrou,
      }
    : null;

  return {
    dto,
    resultado,
    resumoAnterior,
    contas,
    parcelasCartao: fatura.parcelas,
    faturaCartao: fatura.fatura,
    metaRendimentoPassivo: preferencia.metaRendimentoPassivo,
    gastoPessoalMes: preferencia.gastoPessoalMes,
    emprestimosMeta: emprestimos,
    reposicaoMeta: reposicao,
    abertoMeta: emprestimos.reduce((acc, emprestimo) => acc + emprestimo.aberto, 0),
  };
}
