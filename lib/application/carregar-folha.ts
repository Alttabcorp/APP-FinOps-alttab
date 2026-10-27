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
  const resultado = calcularMesPersistido(
    mes,
    fatura.faturaParcelas,
    preferencia.gastoPessoalMes,
    reposicao,
    fatura.faturaFixo,
  );
  const resultadoAnterior = mesAnterior
    ? calcularMesPersistido(
        mesAnterior,
        faturaDoMes(fatura.compras, mesAnterior.competencia),
        preferencia.gastoPessoalMes,
        somarDevolucao(emprestimos, mesAnterior.competencia),
        fatura.faturaFixo,
      )
    : null;
  const resumoAnterior = mesAnterior && resultadoAnterior
    ? {
        competencia: mesAnterior.competencia,
        sobrou: resultadoAnterior.resumo.sobrou,
        ganhou: resultadoAnterior.resumo.ganhou,
      }
    : null;

  return {
    dto,
    resultado,
    resumoAnterior,
    contas,
    parcelasCartao: fatura.parcelas,
    recorrentesCartao: fatura.recorrentes,
    faturaCartao: fatura.faturaParcelas,
    cartaoFixo: fatura.faturaFixo,
    metaRendimentoPassivo: preferencia.metaRendimentoPassivo,
    gastoPessoalMes: preferencia.gastoPessoalMes,
    destinoCartaoNome: preferencia.destinoCartaoNome,
    destinoCartaoChave: preferencia.destinoCartaoChave,
    emprestimosMeta: emprestimos,
    reposicaoMeta: reposicao,
    abertoMeta: emprestimos.reduce((acc, emprestimo) => acc + emprestimo.aberto, 0),
  };
}
