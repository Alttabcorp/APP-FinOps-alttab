import { calcularProgressoMeta, type ProgressoMeta } from "@/lib/domain/financeiro/conta";
import { formatarMoeda } from "@/lib/formatacao";
import type { carregarDashboard } from "@/lib/application/carregar-dashboard";

export type DashboardDados = NonNullable<Awaited<ReturnType<typeof carregarDashboard>>>;

export type LinhaMeta = {
  id: string;
  href: string;
  rotulo: string;
  detalhe: string;
  progresso: ProgressoMeta;
};

export function destinoConta(finalidade: DashboardDados["contas"][number]["finalidade"]) {
  if (finalidade === "INVESTIMENTO" || finalidade === "POUPANCA") return "/investimentos";
  if (finalidade === "EMPRESA") return "/empresa";
  return "/contas";
}

export function montarMetas(
  dados: Pick<DashboardDados, "contas" | "resultado" | "metaRendimentoPassivo" | "emprestimosMeta">,
): LinhaMeta[] {
  const linhas: LinhaMeta[] = [];

  for (const conta of dados.contas) {
    if (!conta.progresso.temMeta) continue;
    linhas.push({
      id: `conta-${conta.id}`,
      href: destinoConta(conta.finalidade),
      rotulo: conta.nome,
      detalhe: `Objetivo ${formatarMoeda(conta.progresso.meta)}`,
      progresso: conta.progresso,
    });
  }

  const rendaPassiva = calcularProgressoMeta(dados.resultado.rendimento.total, dados.metaRendimentoPassivo);
  if (rendaPassiva.temMeta) {
    linhas.push({
      id: "renda-passiva",
      href: "/entradas",
      rotulo: "Renda passiva",
      detalhe: `Neste mês · objetivo ${formatarMoeda(rendaPassiva.meta)}`,
      progresso: rendaPassiva,
    });
  }

  for (const emprestimo of dados.emprestimosMeta) {
    if (emprestimo.quitado || !emprestimo.progresso.temMeta) continue;
    linhas.push({
      id: `emprestimo-${emprestimo.id}`,
      href: emprestimo.contaFinalidade === "POUPANCA" ? "/investimentos" : "/contas",
      rotulo: emprestimo.nome,
      detalhe: `Repor · falta ${formatarMoeda(emprestimo.aberto)}`,
      progresso: emprestimo.progresso,
    });
  }

  return linhas;
}

export function montarAtencao({
  competencia,
  pagamento,
  resultado,
  feiraReal,
  cartaoReal,
  gasolinaReal,
  poupancaEditado,
  fechado,
  abertoMeta,
}: {
  competencia: string;
  pagamento: { total: number; pagas: number };
  resultado: DashboardDados["resultado"];
  feiraReal: number;
  cartaoReal: number;
  gasolinaReal: number;
  poupancaEditado: boolean;
  fechado: boolean;
  abertoMeta: number;
}) {
  if (fechado) return [];
  const itens: { href: string; rotulo: string }[] = [];
  const faltam = pagamento.total - pagamento.pagas;
  if (faltam > 0) {
    itens.push({
      href: "/#rito-contas",
      rotulo: faltam === 1 ? "Falta 1 conta" : `Faltam ${faltam} contas`,
    });
  }
  const cartao = resultado.despesasVariaveis.cartao;
  if (cartao.estoura) {
    itens.push({ href: "/#rito-cartao", rotulo: "Fatura passa do teto" });
  } else if (resultado.prioridade.find((etapa) => etapa.id === "cartao")?.status === "falta") {
    itens.push({ href: "/#rito-cartao", rotulo: "Pagar o cartão" });
  }
  if (resultado.prioridade.find((etapa) => etapa.id === "poupanca")?.status === "falta") {
    itens.push({ href: "/investimentos#rito-poupanca", rotulo: "Poupança" });
  } else if (!poupancaEditado && resultado.resumo.ganhou > 0.005) {
    itens.push({ href: "/investimentos#rito-poupanca", rotulo: "Confirmar a poupança" });
  }
  if (resultado.despesasVariaveis.feira.sugestao > 0.005 && feiraReal < 0.005) {
    itens.push({ href: "/#rito-feira", rotulo: "Informar feira" });
  }
  if (resultado.prioridade.find((etapa) => etapa.id === "investimento")?.status === "falta") {
    itens.push({ href: "/investimentos#rito-fundo", rotulo: "Fundo e Alttab" });
  }
  const reposicao = resultado.prioridade.find((etapa) => etapa.id === "reposicao");
  if (reposicao && reposicao.precisa > 0.005) {
    itens.push({ href: "/contas", rotulo: "Repor a retirada" });
  } else if (abertoMeta > 0.005) {
    itens.push({ href: "/contas", rotulo: "Ainda falta repor" });
  }
  if (resultado.despesasVariaveis.gasolina.sugestao > 0.005 && gasolinaReal < 0.005) {
    itens.push({ href: "/#rito-feira", rotulo: "Informar gasolina" });
  }
  return itens;
}
