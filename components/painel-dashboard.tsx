"use client";

import Link from "next/link";
import { useState } from "react";
import { caminhoFolha } from "@/components/abas-folha";
import { BarraMeta } from "@/components/barra-meta";
import { ModalAdicionar } from "@/components/modal-adicionar";
import type { carregarDashboard } from "@/lib/application/carregar-dashboard";
import { progressoPagamento } from "@/lib/application/checklist";
import {
  formatarCompetencia,
  formatarNomeMes,
} from "@/lib/domain/financeiro/competencia";
import { calcularProgressoMeta, type ProgressoMeta } from "@/lib/domain/financeiro/conta";
import { formatarDeltaMes, formatarMoeda } from "@/lib/formatacao";

type Dashboard = NonNullable<Awaited<ReturnType<typeof carregarDashboard>>>;

type Props = {
  dados: Dashboard;
};

export function PainelDashboard({ dados }: Props) {
  const [adicionar, setAdicionar] = useState(false);
  const { dto, resultado, resumoAnterior, competencia } = dados;
  const pagamento = progressoPagamento(dto.itens);
  const recentes = dados.resumos.slice(-4).reverse();
  const deltaSobrou = resumoAnterior ? resultado.resumo.sobrou - resumoAnterior.sobrou : 0;
  const atencao = montarAtencao({
    competencia,
    pagamento,
    resultado,
    feiraReal: dto.feiraReal,
    cartaoReal: dto.cartaoReal + dados.faturaCartao,
    gasolinaReal: dto.gasolinaReal,
    poupancaEditado: dto.poupancaEditado,
    fechado: dto.fechado,
    abertoMeta: dados.abertoMeta,
  });

  const fatos = [
    {
      href: "/entradas",
      rotulo: "Ganhou",
      valor: formatarMoeda(resultado.resumo.ganhou),
      tom: "inflow" as const,
    },
    {
      href: "/gastos",
      rotulo: "Gastou",
      valor: formatarMoeda(resultado.resumo.gasto),
      tom: "outflow" as const,
    },
    {
      href: caminhoFolha(competencia, "pagar"),
      rotulo: "A pagar",
      valor: pagamento.total === 0 ? "—" : formatarMoeda(pagamento.aberto),
      detalhe: pagamento.total === 0 ? "Nada neste mês" : `${pagamento.pagas} de ${pagamento.total} pagas`,
    },
    {
      href: "/cartao",
      rotulo: "Fatura",
      valor: formatarMoeda(dados.faturaCartao),
    },
  ];

  const bolsos = [
    {
      href: "/contas",
      rotulo: "Meta",
      valor: dados.totais.meta,
      detalhe: dados.abertoMeta > 0.005 ? `Deve ${formatarMoeda(dados.abertoMeta)}` : undefined,
    },
    { href: "/contas", rotulo: "Reserva", valor: dados.totais.reserva },
    { href: "/investimentos", rotulo: "Poupança", valor: dados.totais.poupanca },
    { href: "/investimentos", rotulo: "Investimento", valor: dados.totais.investimento },
    { href: "/empresa", rotulo: "Empresa", valor: dados.totais.empresa },
  ];
  const metas = montarMetas(dados);

  return (
    <article className="mx-auto max-w-[76rem] px-4 py-6 pb-16 lg:px-8 lg:py-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="titulo">{formatarCompetencia(competencia)}</h1>
          <p className="mt-1 text-sm text-mute">{dto.fechado ? "Mês fechado" : "Mês em aberto"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href={caminhoFolha(competencia, "visao")}>
            {dto.fechado ? "Reabrir o mês" : "Fechar o mês"}
          </Link>
          <button className="btn-primary" type="button" onClick={() => setAdicionar(true)}>
            Adicionar
          </button>
        </div>
      </header>

      <div className="dash mt-6">
        <div className="dash-topo">
          <Link href={caminhoFolha(competencia, "visao")} className="kpi is-principal">
            <p className="kpi-rotulo">Resultado do mês</p>
            <div>
              <p
                className={`amount kpi-valor ${
                  resultado.resumo.sobrou >= 0 ? "text-inflow" : "text-outflow"
                }`}
              >
                {formatarMoeda(resultado.resumo.sobrou)}
              </p>
              {resumoAnterior ? (
                <p
                  className={`mt-3 text-sm ${
                    Math.abs(deltaSobrou) < 0.005
                      ? "text-mute"
                      : deltaSobrou > 0
                        ? "text-inflow"
                        : "text-outflow"
                  }`}
                >
                  {formatarDeltaMes(
                    resultado.resumo.sobrou,
                    resumoAnterior.sobrou,
                    formatarNomeMes(resumoAnterior.competencia),
                  )}
                </p>
              ) : (
                <p className="mt-3 text-sm text-mute">O que sobrou depois das contas e dos aportes.</p>
              )}
            </div>
          </Link>

          <section className="kpi" aria-label="Pendências">
            <h2 className="titulo-secao">Pendências</h2>
            {atencao.length === 0 ? (
              <p className="mt-4 text-sm text-inflow">
                {dto.fechado ? "Mês fechado. Os números não mudam até reabrir." : "Nada pendente."}
              </p>
            ) : (
              <ul className="kpi-lista">
                {atencao.map((item) => (
                  <li key={item.href + item.rotulo}>
                    <Link href={item.href}>
                      <span>{item.rotulo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section>
          <header className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="titulo-secao">Metas</h2>
            <Link className="text-sm text-mute hover:underline" href="/contas">
              Contas
            </Link>
          </header>
          {metas.length === 0 ? (
            <p className="mt-3 text-sm text-mute">
              Cadastre o objetivo da meta e da renda passiva para ver o progresso aqui.
            </p>
          ) : (
            <ul className="dash-metas">
              {metas.map((meta) => (
                <li key={meta.id}>
                  <Link href={meta.href} className="kpi">
                    <p className="kpi-rotulo">{meta.rotulo}</p>
                    <p className="amount kpi-valor">{formatarMoeda(meta.progresso.saldo)}</p>
                    <p className="mt-1 text-sm text-mute">{meta.detalhe}</p>
                    <div className="mt-4">
                      <BarraMeta nome={meta.rotulo} progresso={meta.progresso} destaque />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-kpis" aria-label="Números do mês">
          {fatos.map((fato) => (
            <Link key={fato.rotulo} href={fato.href} className="kpi">
              <p className="kpi-rotulo">{fato.rotulo}</p>
              <p
                className={`amount kpi-valor ${
                  fato.tom === "inflow" ? "text-inflow" : fato.tom === "outflow" ? "text-outflow" : ""
                }`}
              >
                {fato.valor}
              </p>
              {"detalhe" in fato && fato.detalhe ? (
                <p className="mt-2 text-sm text-mute">{fato.detalhe}</p>
              ) : null}
            </Link>
          ))}
        </section>

        <section>
          <header className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="titulo-secao">Posição</h2>
            <Link className="text-sm text-mute hover:underline" href="/contas">
              Contas
            </Link>
          </header>
          <ul className="dash-bolsos">
            {bolsos.map((bolso) => (
              <li key={bolso.rotulo}>
                <Link href={bolso.href} className="kpi">
                  <p className="kpi-rotulo">{bolso.rotulo}</p>
                  <p className="amount kpi-valor">{formatarMoeda(bolso.valor)}</p>
                  {bolso.detalhe ? <p className="mt-2 text-sm text-outflow">{bolso.detalhe}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {recentes.length > 0 ? (
          <section>
            <header className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="titulo-secao">Meses</h2>
              <Link className="text-sm text-mute hover:underline" href="/historico">
                Histórico
              </Link>
            </header>
            <ul className="dash-meses">
              {recentes.map((linha) => (
                <li key={linha.competencia}>
                  <Link href={`/meses/${linha.competencia}`} className="kpi">
                    <p className="kpi-rotulo">{formatarCompetencia(linha.competencia)}</p>
                    <p
                      className={`amount kpi-valor ${
                        linha.sobrou >= 0 ? "text-inflow" : "text-outflow"
                      }`}
                    >
                      {formatarMoeda(linha.sobrou)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <ModalAdicionar aberto={adicionar} onClose={() => setAdicionar(false)} />
    </article>
  );
}

function montarMetas(dados: Dashboard) {
  const linhas: { id: string; href: string; rotulo: string; detalhe: string; progresso: ProgressoMeta }[] = [];

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
      href: "/contas",
      rotulo: emprestimo.nome,
      detalhe: `Devolver à meta · falta ${formatarMoeda(emprestimo.aberto)}`,
      progresso: emprestimo.progresso,
    });
  }

  return linhas;
}

function destinoConta(finalidade: Dashboard["contas"][number]["finalidade"]) {
  if (finalidade === "INVESTIMENTO" || finalidade === "POUPANCA") return "/investimentos";
  if (finalidade === "EMPRESA") return "/empresa";
  return "/contas";
}

function montarAtencao({
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
  resultado: Dashboard["resultado"];
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
      href: caminhoFolha(competencia, "pagar"),
      rotulo: faltam === 1 ? "Falta 1 conta" : `Faltam ${faltam} contas`,
    });
  }
  if (resultado.prioridade.find((etapa) => etapa.id === "cartao")?.status === "falta") {
    itens.push({ href: "/cartao", rotulo: "Pagar o cartão" });
  } else if (resultado.despesasVariaveis.cartao.sugestao > 0.005 && cartaoReal < 0.005) {
    itens.push({ href: "/cartao", rotulo: "Informar cartão" });
  }
  if (resultado.prioridade.find((etapa) => etapa.id === "poupanca")?.status === "falta") {
    itens.push({ href: "/investimentos?novo=aporte", rotulo: "Poupança" });
  } else if (!poupancaEditado) {
    itens.push({ href: "/investimentos?novo=aporte", rotulo: "Poupança ainda automática" });
  }
  if (resultado.despesasVariaveis.feira.sugestao > 0.005 && feiraReal < 0.005) {
    itens.push({ href: caminhoFolha(competencia, "gastos"), rotulo: "Informar feira" });
  }
  if (resultado.prioridade.find((etapa) => etapa.id === "investimento")?.status === "falta") {
    itens.push({ href: "/investimentos", rotulo: "Investimento" });
  }
  const reposicao = resultado.prioridade.find((etapa) => etapa.id === "reposicao");
  if (reposicao && reposicao.precisa > 0.005) {
    itens.push({ href: "/contas", rotulo: "Devolver à meta" });
  } else if (abertoMeta > 0.005) {
    itens.push({ href: "/contas", rotulo: "Dívida com a meta" });
  }
  if (resultado.despesasVariaveis.gasolina.sugestao > 0.005 && gasolinaReal < 0.005) {
    itens.push({ href: caminhoFolha(competencia, "gastos"), rotulo: "Informar gasolina" });
  }
  return itens;
}
