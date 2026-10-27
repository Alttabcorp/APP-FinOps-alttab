import { listarComprasCartao, listarRecorrentesCartao } from "@/lib/application/cartao-service";
import { listarContas } from "@/lib/application/conta-service";
import { listarEmprestimosMeta } from "@/lib/application/emprestimo-meta-service";
import { calcularMesPersistido } from "@/lib/application/mes-mapper";
import { prisma } from "@/lib/db/prisma";
import { faturaDoMes, somarRecorrentes } from "@/lib/domain/financeiro/cartao";
import { somarSaldos } from "@/lib/domain/financeiro/conta";
import { somarDevolucao } from "@/lib/domain/financeiro/emprestimo-meta";
import { somarContaClassificada, type LinhaAcompanhar } from "@/lib/domain/financeiro/acompanhar";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";
import {
  linhasDepositoInvestimento,
  montarRoteiroTransferencia,
  type CampoDeposito,
} from "@/lib/domain/financeiro/transferencia";
import { obterPreferenciaCasa } from "@/lib/application/renda-service";

export async function carregarAcompanhamento() {
  const [meses, compras, recorrentes, preferencia, emprestimos, contas] = await Promise.all([
    prisma.mesFinanceiro.findMany({
      include: { itens: { orderBy: { ordem: "asc" } } },
      orderBy: { competencia: "asc" },
    }),
    listarComprasCartao(),
    listarRecorrentesCartao(),
    obterPreferenciaCasa(),
    listarEmprestimosMeta(),
    listarContas(),
  ]);
  const cartaoFixo = somarRecorrentes(recorrentes);

  const linhas: LinhaAcompanhar[] = meses.map((mes) => {
    const fatura = faturaDoMes(compras, mes.competencia);
    const resultado = calcularMesPersistido(
      mes,
      fatura,
      preferencia.gastoPessoalMes,
      somarDevolucao(emprestimos, mes.competencia),
      cartaoFixo,
    );
    const itens = mes.itens.map((item) => ({
      tipo: item.tipo,
      nome: item.nome,
      valor: Number(item.valor),
    }));
    return {
      competencia: mes.competencia,
      salario: resultado.totalSaldo,
      ganhou: resultado.resumo.ganhou,
      gasto: resultado.resumo.gasto,
      sobrou: resultado.resumo.sobrou,
      cartao: resultado.despesasVariaveis.cartao.real,
      agua: somarContaClassificada(itens, "agua"),
      energia: somarContaClassificada(itens, "energia"),
      poupanca: resultado.investimentos.poupanca.real,
      fundo: resultado.investimentos.fundo.real,
      alttab: resultado.investimentos.alttab.real,
      investido: resultado.investimentos.totalInvestido,
      paraMeta: resultado.distribuicao.metaFinal,
      fechado: mes.fechado,
    };
  });

  const atual = competenciaAtual();
  const mesAtual = meses.find((mes) => mes.competencia === atual) ?? null;
  const resultadoAtual = mesAtual
    ? calcularMesPersistido(
        mesAtual,
        faturaDoMes(compras, mesAtual.competencia),
        preferencia.gastoPessoalMes,
        somarDevolucao(emprestimos, mesAtual.competencia),
        cartaoFixo,
      )
    : linhas.at(-1)
      ? calcularMesPersistido(
          meses[meses.length - 1],
          faturaDoMes(compras, meses[meses.length - 1].competencia),
          preferencia.gastoPessoalMes,
          somarDevolucao(emprestimos, meses[meses.length - 1].competencia),
          cartaoFixo,
        )
      : null;

  const depositos = resultadoAtual
    ? linhasDepositoInvestimento(
        montarRoteiroTransferencia(resultadoAtual, {
          contas,
          anuais: [],
          destinoCartao: null,
        }),
      )
    : [];

  const marcas: Record<CampoDeposito, boolean> = {
    poupanca: Boolean(mesAtual?.poupancaDepositado),
    fundo: Boolean(mesAtual?.fundoDepositado),
    alttab: Boolean(mesAtual?.alttabDepositado),
    meta: Boolean(mesAtual?.metaDepositado),
  };

  return {
    linhas,
    estoque: {
      poupanca: somarSaldos(contas.filter((conta) => conta.finalidade === "POUPANCA")),
      investimento: somarSaldos(contas.filter((conta) => conta.finalidade === "INVESTIMENTO")),
      meta: somarSaldos(contas.filter((conta) => conta.finalidade === "META")),
    },
    mesAtual: mesAtual
      ? {
          competencia: mesAtual.competencia,
          fechado: mesAtual.fechado,
          marcas,
        }
      : null,
    depositos,
  };
}
