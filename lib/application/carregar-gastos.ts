import { listarComprasCartao } from "@/lib/application/cartao-service";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { mesParaDto } from "@/lib/application/mes-mapper";
import { listarMesesRecentes } from "@/lib/application/mes-service";
import { faturaDoMes, parcelasDoMes } from "@/lib/domain/financeiro/cartao";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";
import { analisarGastos, type EntradaGastosMes } from "@/lib/domain/financeiro/gasto";

const entradaDoMes = (
  dto: ReturnType<typeof mesParaDto>,
  fatura: number,
  parcelas: { nome: string; valor: number }[],
  recorrentes: { nome: string; valor: number }[] = [],
): EntradaGastosMes => ({
  itens: dto.itens,
  feira: dto.feiraReal,
  gasolina: dto.gasolinaReal,
  cartaoAvulso: dto.cartaoReal,
  faturaCartao: fatura,
  parcelasCartao: parcelas,
  recorrentesCartao: recorrentes,
});

export async function carregarGastos(competenciaPedido?: string) {
  const competencia = competenciaPedido && isCompetencia(competenciaPedido) ? competenciaPedido : competenciaAtual();
  const [folha, compras, meses] = await Promise.all([
    carregarFolha(competencia),
    listarComprasCartao(),
    listarMesesRecentes(6),
  ]);
  if (!folha) return null;

  const atual = entradaDoMes(folha.dto, folha.faturaCartao, folha.parcelasCartao, folha.recorrentesCartao);
  const mesAnterior = meses.filter((mes) => mes.competencia < competencia).at(-1);
  const anterior = mesAnterior
    ? entradaDoMes(
        mesParaDto(mesAnterior),
        faturaDoMes(compras, mesAnterior.competencia),
        parcelasDoMes(compras, mesAnterior.competencia),
      )
    : null;

  const historico = meses.map((mes) => {
    const dto = mesParaDto(mes);
    const parcelas = parcelasDoMes(compras, mes.competencia);
    return {
      competencia: mes.competencia,
      entrada: entradaDoMes(dto, faturaDoMes(compras, mes.competencia), parcelas),
    };
  });

  return {
    competencia,
    dto: folha.dto,
    resultado: folha.resultado,
    parcelasCartao: folha.parcelasCartao,
    faturaCartao: folha.faturaCartao,
    gastoPessoalMes: folha.gastoPessoalMes,
    reposicaoMeta: folha.reposicaoMeta,
    cartaoFixo: folha.cartaoFixo,
    analise: analisarGastos(atual, anterior, {
      feira: folha.resultado.despesasVariaveis.feira.sugestao,
      gasolina: folha.resultado.despesasVariaveis.gasolina.sugestao,
    }),
    historico,
  };
}
