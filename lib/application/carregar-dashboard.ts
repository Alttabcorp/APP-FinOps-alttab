import { carregarFolha } from "@/lib/application/carregar-folha";
import { progressoPagamento } from "@/lib/application/checklist";
import { listarResumos } from "@/lib/application/mes-service";
import { somarSaldos } from "@/lib/domain/financeiro/conta";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";

export async function carregarDashboard() {
  const competencia = competenciaAtual();
  const [folha, resumos] = await Promise.all([carregarFolha(competencia), listarResumos()]);

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
    metaRendimentoPassivo: folha.metaRendimentoPassivo,
    gastoPessoalMes: folha.gastoPessoalMes,
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
