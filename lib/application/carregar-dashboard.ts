import { listarContasAnuais } from "@/lib/application/anual-service";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { progressoPagamento } from "@/lib/application/checklist";
import { listarResumos } from "@/lib/application/mes-service";
import { somarSaldos } from "@/lib/domain/financeiro/conta";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

export async function carregarDashboard(competenciaPedido?: string) {
  const competencia = competenciaPedido && isCompetencia(competenciaPedido) ? competenciaPedido : competenciaAtual();
  const [folha, resumos, anuais] = await Promise.all([
    carregarFolha(competencia),
    listarResumos(),
    listarContasAnuais(),
  ]);

  if (!folha) return null;

  const pagamento = progressoPagamento(folha.dto.itens);
  const contasMeta = folha.contas.filter((conta) => conta.finalidade === "META");
  const contasReserva = folha.contas.filter((conta) => conta.finalidade === "RESERVA");
  const contasInvestimento = folha.contas.filter((conta) => conta.finalidade === "INVESTIMENTO");
  const contasPoupanca = folha.contas.filter((conta) => conta.finalidade === "POUPANCA");
  const contasEmpresa = folha.contas.filter((conta) => conta.finalidade === "EMPRESA");

  return {
    competencia,
    dto: folha.dto,
    resultado: folha.resultado,
    resumoAnterior: folha.resumoAnterior,
    contas: folha.contas,
    faturaCartao: folha.faturaCartao,
    parcelasCartao: folha.parcelasCartao,
    recorrentesCartao: folha.recorrentesCartao,
    cartaoFixo: folha.cartaoFixo,
    metaRendimentoPassivo: folha.metaRendimentoPassivo,
    gastoPessoalMes: folha.gastoPessoalMes,
    destinoCartaoNome: folha.destinoCartaoNome,
    destinoCartaoChave: folha.destinoCartaoChave,
    anuais,
    resumos,
    pagamento,
    emprestimosMeta: folha.emprestimosMeta,
    reposicaoMeta: folha.reposicaoMeta,
    abertoMeta: folha.abertoMeta,
    totais: {
      contas: somarSaldos(folha.contas),
      meta: somarSaldos(contasMeta),
      reserva: somarSaldos(contasReserva),
      poupanca: somarSaldos(contasPoupanca),
      investimento: somarSaldos(contasInvestimento),
      empresa: somarSaldos(contasEmpresa),
    },
  };
}
