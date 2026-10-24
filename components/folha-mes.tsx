"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  criarProximoMesAction,
  definirMesFechadoAction,
  salvarMesAction,
  trazerValoresMesAnteriorAction,
} from "@/app/actions/mes";
import { AbasFolha, AtalhosFolha, caminhoFolha, type AbaFolha } from "@/components/abas-folha";
import { CampoMes } from "@/components/campo-mes";
import { CampoMoeda } from "@/components/campo-moeda";
import { ChecklistPagar } from "@/components/checklist-pagar";
import { classeVariacao, ComparativoValores } from "@/components/comparativo-valores";
import { FaixaFalta } from "@/components/faixa-falta";
import { FaixaGastoPessoal } from "@/components/faixa-metas";
import { FaixaPrioridade } from "@/components/faixa-prioridade";
import { FormularioLeve } from "@/components/formulario-modal";
import { ListaItens } from "@/components/lista-itens";
import { Modal } from "@/components/modal";
import { OpcoesCopia } from "@/components/opcoes-copia";
import { ResumoGrupo } from "@/components/resumo-grupo";
import { progressoPagamento } from "@/lib/application/checklist";
import type { ItemDTO, MesDTO } from "@/lib/application/mes-mapper";
import { calcularMes } from "@/lib/domain/financeiro/calcular-mes";
import {
  avancarCompetencia,
  formatarCompetencia,
  formatarNomeMes,
} from "@/lib/domain/financeiro/competencia";
import { TIPOS_COPIA_PADRAO } from "@/lib/domain/financeiro/copiar-mes";
import type { ParcelaCartao } from "@/lib/domain/financeiro/cartao";
import type { ResultadoMes, TipoItem } from "@/lib/domain/financeiro/tipos";
import { formatarDeltaMes, formatarMoeda, formatarVariacao } from "@/lib/formatacao";

export type ResumoAnterior = {
  competencia: string;
  sobrou: number;
};

type Props = {
  aba: AbaFolha;
  mesInicial: MesDTO;
  resultadoInicial: ResultadoMes;
  resumoAnterior?: ResumoAnterior | null;
  parcelasCartao?: ParcelaCartao[];
  faturaCartao?: number;
  gastoPessoalMes?: number | null;
  reposicaoMeta?: number;
};

type EditorAberto =
  | "mes"
  | "copia"
  | "fechar"
  | "reabrir"
  | "saldo"
  | "contas"
  | "extra"
  | "extraMes"
  | "variaveis"
  | "investimentos"
  | null;

const porTipo = (itens: ItemDTO[], tipo: TipoItem) => itens.filter((item) => item.tipo === tipo);

const NOTAS_ABA: Record<AbaFolha, string> = {
  visao: "Feche o mês quando os números estiverem certos. Entradas, gastos e aportes ficam nas páginas do menu.",
  entradas: "Empregos, bicos, vales e rendimento.",
  pagar: "Marque o que já saiu.",
  gastos: "Feira, gasolina, cartão e gasto pessoal.",
};

export function FolhaMes({
  aba,
  mesInicial,
  resultadoInicial,
  resumoAnterior = null,
  parcelasCartao = [],
  faturaCartao = 0,
  gastoPessoalMes = null,
  reposicaoMeta = 0,
}: Props) {
  const router = useRouter();
  const [mes, setMes] = useState(mesInicial);
  const [status, setStatus] = useState("Pronto para preencher.");
  const [pendente, startTransition] = useTransition();
  const [sujo, setSujo] = useState(false);
  const [editor, setEditor] = useState<EditorAberto>(null);
  const [copia, setCopia] = useState<TipoItem[]>([...TIPOS_COPIA_PADRAO]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setMes(mesInicial);
    setSujo(false);
  }, [mesInicial]);

  useEffect(() => {
    const avisar = (evento: BeforeUnloadEvent) => {
      if (!sujo) return;
      evento.preventDefault();
      evento.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sujo]);

  const resultado = useMemo(() => {
    return calcularMes({
      saldo: porTipo(mes.itens, "SALDO"),
      extra: porTipo(mes.itens, "EXTRA"),
      contas: porTipo(mes.itens, "CONTA"),
      extraMes: porTipo(mes.itens, "EXTRA_MES"),
      anuais: porTipo(mes.itens, "ANUAL"),
      despesasVariaveis: {
        feira: mes.feiraReal,
        cartao: mes.cartaoReal + faturaCartao,
        gasolina: mes.gasolinaReal,
      },
      investimentos: {
        fundo: mes.fundoReal,
        alttab: mes.alttabReal,
        poupanca: mes.poupancaReal,
        poupancaEditado: mes.poupancaEditado,
      },
      gastoPessoalAlvo: gastoPessoalMes,
      reposicaoMeta,
    });
  }, [mes, faturaCartao, gastoPessoalMes, reposicaoMeta]);

  const comPoupancaAutomatica = (origem: MesDTO): MesDTO => {
    if (origem.poupancaEditado) return origem;
    const calculado = calcularMes({
      saldo: porTipo(origem.itens, "SALDO"),
      extra: porTipo(origem.itens, "EXTRA"),
      contas: porTipo(origem.itens, "CONTA"),
      extraMes: porTipo(origem.itens, "EXTRA_MES"),
      anuais: porTipo(origem.itens, "ANUAL"),
      despesasVariaveis: {
        feira: origem.feiraReal,
        cartao: origem.cartaoReal,
        gasolina: origem.gasolinaReal,
      },
      investimentos: {
        fundo: origem.fundoReal,
        alttab: origem.alttabReal,
        poupanca: origem.poupancaReal,
        poupancaEditado: false,
      },
    });
    return { ...origem, poupancaReal: calculado.investimentos.poupanca.sugestao };
  };

  const mesComPoupanca = comPoupancaAutomatica(mes);

  const salvar = (proximo = mesComPoupanca) => {
    if (proximo.fechado) return;
    startTransition(async () => {
      setStatus("Salvando…");
      const resposta = await salvarMesAction(comPoupancaAutomatica(proximo));
      if (resposta.ok) {
        setMes(resposta.mes);
        setSujo(false);
        setStatus("Salvo.");
      } else {
        setStatus(resposta.erro);
      }
    });
  };

  const agendarSalvar = (proximo: MesDTO) => {
    if (mes.fechado) return;
    setMes(proximo);
    setSujo(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => salvar(proximo), 600);
  };

  const atualizarItens = (tipo: TipoItem, itens: ItemDTO[]) => {
    const demais = mes.itens.filter((item) => item.tipo !== tipo);
    agendarSalvar({ ...mes, itens: [...demais, ...itens] });
  };

  const marcarPago = (indice: number, pago: boolean) => {
    agendarSalvar({
      ...mes,
      itens: mes.itens.map((item, i) => (i === indice ? { ...item, pago } : item)),
    });
  };

  const irPara = (competencia: string) => {
    if (sujo && !mes.fechado) salvar(mesComPoupanca);
    router.push(caminhoFolha(competencia, aba));
    setEditor(null);
  };

  const aplicarMes = (proximo: MesDTO, mensagem: string) => {
    setMes(proximo);
    setSujo(false);
    setStatus(mensagem);
    setEditor(null);
    router.refresh();
  };

  const proximo = avancarCompetencia(mes.competencia, 1);
  const totais = resultado ?? resultadoInicial;
  const somenteLeitura = mes.fechado;
  const baseBarra = Math.max(totais.resumo.ganhou, totais.resumo.gasto, 1);
  const ganhouPct = Math.min(100, (totais.resumo.ganhou / baseBarra) * 100);
  const gastouPct = Math.min(100, (totais.resumo.gasto / baseBarra) * 100);
  const progresso = progressoPagamento(mes.itens);
  const deltaSobrou = resumoAnterior
    ? totais.resumo.sobrou - resumoAnterior.sobrou
    : 0;

  return (
    <article className="mx-auto max-w-[72rem] px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">
            {formatarCompetencia(mes.competencia)}
          </h1>
          <p className="mt-2 max-w-[42ch] text-sm text-mute">
            {somenteLeitura ? "Mês fechado. Os números não mudam até reabrir." : NOTAS_ABA[aba]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn"
            type="button"
            onClick={() => {
              setCopia([...TIPOS_COPIA_PADRAO]);
              setEditor("mes");
            }}
          >
            Trocar mês
          </button>
          {somenteLeitura ? (
            <button className="btn" type="button" onClick={() => setEditor("reabrir")}>
              Reabrir mês
            </button>
          ) : (
            <>
              {resumoAnterior ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setCopia([...TIPOS_COPIA_PADRAO]);
                    setEditor("copia");
                  }}
                >
                  Trazer de {formatarNomeMes(resumoAnterior.competencia)}
                </button>
              ) : null}
              <button className="btn" type="button" onClick={() => setEditor("fechar")}>
                Fechar mês
              </button>
              <button
                className="btn-primary hidden disabled:opacity-60 lg:inline-flex"
                type="button"
                disabled={pendente}
                onClick={() => salvar()}
              >
                {pendente ? "Salvando…" : "Salvar mês"}
              </button>
            </>
          )}
        </div>
      </header>

      <AbasFolha competencia={mes.competencia} aba={aba} />

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {aba === "visao" ? (
        <>
          <section className="dash-topo mt-6">
            <div className="kpi is-principal">
              <p className="kpi-rotulo">Resultado do mês</p>
              <div>
                <p
                  className={`amount kpi-valor ${
                    totais.resumo.sobrou >= 0 ? "text-inflow" : "text-outflow"
                  }`}
                >
                  {formatarMoeda(totais.resumo.sobrou)}
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
                      totais.resumo.sobrou,
                      resumoAnterior.sobrou,
                      formatarNomeMes(resumoAnterior.competencia),
                    )}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-mute">O que sobrou depois das contas e dos aportes.</p>
                )}
              </div>
            </div>
            <div className="kpi flex flex-col justify-center gap-5">
              <BarraKpi rotulo="Ganhou" valor={totais.resumo.ganhou} percentual={ganhouPct} tom="inflow" />
              <BarraKpi rotulo="Gastou" valor={totais.resumo.gasto} percentual={gastouPct} tom="outflow" />
              <p className="text-sm text-mute">Caixa das contas {formatarMoeda(totais.saldoContas)}</p>
            </div>
          </section>

          <div className="mt-8">
            <FaixaPrioridade
              etapas={totais.prioridade}
              competencia={mes.competencia}
              contasPagas={progresso.pagas}
              contasTotal={progresso.total}
            />
          </div>

          <div className="folha-grade mt-8">
            <aside className="folha-lado">
              <section className="panel panel-accent p-5">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Investir</h2>
                    <p className="money mt-1 text-xl font-semibold">
                      {formatarMoeda(totais.investimentos.totalInvestido)}
                    </p>
                  </div>
                  {somenteLeitura ? null : (
                    <Link className="btn shrink-0 text-sm" href="/investimentos?novo=aporte">
                      Ajustar
                    </Link>
                  )}
                </header>
                <ul className="mt-4 grid gap-3">
                  <LinhaInvestimento
                    rotulo="Fundo imobiliário"
                    real={mes.fundoReal}
                    sugestao={totais.investimentos.fundo.sugestao}
                    variacao={totais.investimentos.fundo.variacao}
                  />
                  <LinhaInvestimento
                    rotulo="Alttab"
                    real={mes.alttabReal}
                    sugestao={totais.investimentos.alttab.sugestao}
                    variacao={totais.investimentos.alttab.variacao}
                  />
                  <LinhaInvestimento
                    rotulo="Poupança"
                    real={mesComPoupanca.poupancaReal}
                    sugestao={totais.investimentos.poupanca.sugestao}
                    variacao={totais.investimentos.poupanca.variacao}
                  />
                </ul>
                {totais.rendimento.total >= 0.005 ? (
                  <p className="mt-3 text-xs text-mute">
                    {totais.rendimento.apertado
                      ? `Mês apertado: ${formatarMoeda(totais.rendimento.paraContas)} do rendimento nas contas.`
                      : `Rendimento reinvestido: ${formatarMoeda(totais.rendimento.reinvestido)}.`}
                  </p>
                ) : null}
              </section>
            </aside>

            <div className="folha-trabalho grid gap-6">
              <FaixaFalta
                itens={mes.itens}
                resultado={totais}
                feiraReal={mes.feiraReal}
                cartaoReal={mes.cartaoReal + faturaCartao}
                gasolinaReal={mes.gasolinaReal}
                poupancaEditado={mes.poupancaEditado}
                onIrPagar={() => router.push(caminhoFolha(mes.competencia, "pagar"))}
                onIrGastos={() => router.push(caminhoFolha(mes.competencia, "gastos"))}
                onEditarInvestimentos={() => router.push("/investimentos?novo=aporte")}
                onDevolverMeta={() => router.push("/contas")}
                fechado={somenteLeitura}
              />
              <AtalhosFolha
                ganhou={totais.resumo.ganhou}
                gastos={totais.resumo.gasto}
                aporte={totais.investimentos.totalInvestido}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm">
          Sobrou{" "}
          <span className={`money font-medium ${totais.resumo.sobrou >= 0 ? "text-inflow" : "text-outflow"}`}>
            {formatarMoeda(totais.resumo.sobrou)}
          </span>
          <span className="text-mute"> · caixa {formatarMoeda(totais.saldoContas)}</span>
        </p>
      )}

      {aba === "entradas" ? (
        <div className="mt-6 grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">Informe os valores deste mês. Novas fontes se cadastram em Entradas.</p>
            <Link className="btn shrink-0 text-sm" href="/entradas?novo=entrada">
              Cadastrar entradas e rendimentos
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ResumoGrupo
              titulo="Dinheiro"
              tom="inflow"
              acao="Informar valores"
              itens={porTipo(mes.itens, "SALDO")}
              onEditar={() => setEditor("saldo")}
              somenteLeitura={somenteLeitura}
            />
            <ResumoGrupo
              titulo="Vales e rendimento"
              tom="inflow"
              acao="Editar extra"
              itens={porTipo(mes.itens, "EXTRA")}
              onEditar={() => setEditor("extra")}
              somenteLeitura={somenteLeitura}
            />
          </div>
        </div>
      ) : null}

      {aba === "pagar" ? (
        <div className="mt-6">
          <ChecklistPagar
            itens={mes.itens}
            onToggle={marcarPago}
            onEditarContas={() => setEditor("contas")}
            onEditarExtraMes={() => setEditor("extraMes")}
            somenteLeitura={somenteLeitura}
          />
        </div>
      ) : null}

      {aba === "gastos" ? (
        <>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="panel panel-outflow p-5">
            <header className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">Feira e gasolina</h2>
              {somenteLeitura ? null : (
                <button className="btn shrink-0 text-sm" type="button" onClick={() => setEditor("variaveis")}>
                  Informar reais
                </button>
              )}
            </header>
            <div className="mt-4 grid gap-4">
              <ComparativoValores
                rotulo="Feira"
                sugestao={totais.despesasVariaveis.feira.sugestao}
                real={mes.feiraReal}
                invertida
              />
              <ComparativoValores
                rotulo="Gasolina"
                sugestao={totais.despesasVariaveis.gasolina.sugestao}
                real={mes.gasolinaReal}
                invertida
              />
            </div>
          </section>

          <section className="panel panel-outflow p-5">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Cartão</h2>
                <p className="money mt-1 text-xl font-semibold">{formatarMoeda(mes.cartaoReal + faturaCartao)}</p>
              </div>
              <Link className="btn shrink-0 text-sm" href="/cartao">
                Parcelas
              </Link>
            </header>
            <div className="mt-4">
              <ComparativoValores
                rotulo="Fatura"
                sugestao={totais.despesasVariaveis.cartao.sugestao}
                real={mes.cartaoReal + faturaCartao}
                invertida
              />
              {parcelasCartao.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-sm">
                  {parcelasCartao.map((parcela) => (
                    <li
                      key={`${parcela.nome}-${parcela.atual}`}
                      className="flex justify-between gap-3 border-t border-line pt-2"
                    >
                      <span>
                        {parcela.nome} {parcela.atual}/{parcela.total}
                      </span>
                      <span className="money">{formatarMoeda(parcela.valor)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-mute">Nenhuma parcela neste mês.</p>
              )}
            </div>
          </section>
        </div>
        <div className="mt-6">
          <FaixaGastoPessoal
            gastoPessoal={totais.distribuicao.gastoPessoal}
            gastoPessoalAlvo={gastoPessoalMes}
            sugestaoMetaMes={totais.distribuicao.metaFinal}
          />
        </div>
        </>
      ) : null}

      <p className="mt-4 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <div className="barra-mes">
        <p className="min-w-0 text-sm">
          {somenteLeitura
            ? "Mês fechado"
            : progresso.total === 0
              ? "Sem contas neste mês"
              : `${progresso.pagas} de ${progresso.total} ${progresso.total === 1 ? "paga" : "pagas"}`}
        </p>
        {somenteLeitura ? (
          <button className="btn shrink-0" type="button" onClick={() => setEditor("reabrir")}>
            Reabrir mês
          </button>
        ) : (
          <button className="btn-primary shrink-0 disabled:opacity-60" type="button" disabled={pendente} onClick={() => salvar()}>
            {pendente ? "Salvando…" : "Salvar mês"}
          </button>
        )}
      </div>

      <Modal
        aberto={editor === "mes"}
        titulo="Trocar mês"
        descricao="O mês atual é salvo antes de abrir outro."
        onClose={() => setEditor(null)}
      >
        <div className="form-modal">
          <p className="form-resumo">{formatarCompetencia(mes.competencia)}</p>
          <div className="form-campos">
            <CampoMes
              id="competencia-modal"
              label="Ir para"
              value={mes.competencia}
              onChange={(competencia) => {
                if (competencia) irPara(competencia);
              }}
            />
            <div>
              <OpcoesCopia nome="copia-proximo" selecionados={copia} onChange={setCopia} />
              <p className="mt-2 text-sm text-mute">
                Vale se {formatarNomeMes(proximo)} ainda não existir. Extra do mês fica de fora no padrão.
              </p>
            </div>
          </div>
          <div className="form-acoes">
            <span />
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                startTransition(async () => {
                  if (!mes.fechado) await salvarMesAction(comPoupancaAutomatica(mes));
                  const resposta = await criarProximoMesAction(mes.competencia, copia);
                  if (resposta.ok) {
                    setEditor(null);
                    router.push(`/meses/${proximo}`);
                  } else setStatus(resposta.erro);
                });
              }}
            >
              Abrir próximo mês
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        aberto={editor === "copia"}
        titulo={`Trazer de ${resumoAnterior ? formatarNomeMes(resumoAnterior.competencia) : "mês anterior"}`}
        descricao="Substitui os valores dos grupos marcados. Linhas novas do mês anterior entram; as que só existem neste mês ficam."
        onClose={() => setEditor(null)}
      >
        <OpcoesCopia nome="copia-anterior" selecionados={copia} onChange={setCopia} />
        <button
          className="btn-primary mt-4 disabled:opacity-60"
          type="button"
          disabled={pendente || copia.length === 0}
          onClick={() => {
            startTransition(async () => {
              setStatus("Trazendo valores…");
              const resposta = await trazerValoresMesAnteriorAction(mes.competencia, copia);
              if (resposta.ok) aplicarMes(resposta.mes, "Valores do mês anterior copiados.");
              else setStatus(resposta.erro);
            });
          }}
        >
          {pendente ? "Copiando…" : "Trazer valores"}
        </button>
      </Modal>

      <Modal
        aberto={editor === "fechar"}
        titulo="Fechar este mês"
        descricao="Os números entram no histórico e só mudam se você reabrir."
        onClose={() => setEditor(null)}
      >
        {progresso.total > progresso.pagas ? (
          <p className="text-sm text-outflow">
            {progresso.total - progresso.pagas === 1
              ? "Ainda falta 1 conta."
              : `Ainda faltam ${progresso.total - progresso.pagas} contas.`}
          </p>
        ) : (
          <p className="text-sm">Pode fechar. Contas em dia.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" type="button" onClick={() => setEditor(null)}>
            Continuar editando
          </button>
          <button
            className="btn-primary disabled:opacity-60"
            type="button"
            disabled={pendente}
            onClick={() => {
              startTransition(async () => {
                if (sujo) {
                  const salvo = await salvarMesAction(comPoupancaAutomatica(mes));
                  if (!salvo.ok) {
                    setStatus(salvo.erro);
                    return;
                  }
                }
                const resposta = await definirMesFechadoAction(mes.competencia, true);
                if (resposta.ok) aplicarMes(resposta.mes, "Mês fechado.");
                else setStatus(resposta.erro);
              });
            }}
          >
            {pendente ? "Fechando…" : "Fechar mês"}
          </button>
        </div>
      </Modal>

      <Modal
        aberto={editor === "reabrir"}
        titulo="Reabrir este mês"
        descricao="O histórico volta a ser rascunho até você fechar outra vez."
        onClose={() => setEditor(null)}
      >
        <div className="flex flex-wrap gap-2">
          <button className="btn" type="button" onClick={() => setEditor(null)}>
            Manter fechado
          </button>
          <button
            className="btn-primary disabled:opacity-60"
            type="button"
            disabled={pendente}
            onClick={() => {
              startTransition(async () => {
                const resposta = await definirMesFechadoAction(mes.competencia, false);
                if (resposta.ok) aplicarMes(resposta.mes, "Mês reaberto.");
                else setStatus(resposta.erro);
              });
            }}
          >
            {pendente ? "Reabrindo…" : "Reabrir mês"}
          </button>
        </div>
      </Modal>

      <Modal
        aberto={editor === "saldo"}
        titulo="Editar saldo"
        descricao="Empregos e bicos deste mês. Cadastre novas fontes em Rendas."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <ListaItens
          titulo="Saldo"
          tipo="SALDO"
          itens={porTipo(mes.itens, "SALDO")}
          onChange={(itens) => atualizarItens("SALDO", itens)}
        />
      </Modal>

      <Modal
        aberto={editor === "contas"}
        titulo="Editar contas fixas"
        descricao="Contas que saem todo mês."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <ListaItens
          titulo="Contas fixas"
          tipo="CONTA"
          itens={porTipo(mes.itens, "CONTA")}
          onChange={(itens) => atualizarItens("CONTA", itens)}
        />
      </Modal>

      <Modal
        aberto={editor === "extra"}
        titulo="Editar extra"
        descricao="VA fica na feira. VT entra no caixa. Rendimento reinveste; se o mês apertar, paga as contas."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <ListaItens
          titulo="Extra"
          tipo="EXTRA"
          comPapel
          itens={porTipo(mes.itens, "EXTRA")}
          onChange={(itens) => atualizarItens("EXTRA", itens)}
        />
      </Modal>

      <Modal
        aberto={editor === "extraMes"}
        titulo="Editar extra do mês"
        descricao="Gastos que não se repetem todo mês."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <ListaItens
          titulo="Extra do mês"
          tipo="EXTRA_MES"
          itens={porTipo(mes.itens, "EXTRA_MES")}
          onChange={(itens) => atualizarItens("EXTRA_MES", itens)}
        />
      </Modal>

      <Modal
        aberto={editor === "variaveis"}
        titulo="Informar despesas variáveis"
        descricao="A sugestão vem do VA, do saldo das contas e do VT."
        onClose={() => setEditor(null)}
      >
        <FormularioLeve
          resumo={`Feira + cartão + gasolina: ${formatarMoeda(mes.feiraReal + mes.cartaoReal + mes.gasolinaReal)}. Salva sozinho.`}
        >
          <CampoMoeda
            id="feiraReal"
            label="Feira, real"
            hint={`Sugestão ${formatarMoeda(totais.despesasVariaveis.feira.sugestao)}`}
            value={mes.feiraReal}
            onChange={(feiraReal) => agendarSalvar({ ...mes, feiraReal })}
          />
          <CampoMoeda
            id="cartaoReal"
            label="Avulso no cartão"
            hint={
              faturaCartao > 0.005
                ? `Parcelas ${formatarMoeda(faturaCartao)} · sugestão ${formatarMoeda(totais.despesasVariaveis.cartao.sugestao)}`
                : `Sugestão ${formatarMoeda(totais.despesasVariaveis.cartao.sugestao)}`
            }
            value={mes.cartaoReal}
            onChange={(cartaoReal) => agendarSalvar({ ...mes, cartaoReal })}
          />
          <CampoMoeda
            id="gasolinaReal"
            label="Gasolina, real"
            hint={`Sugestão ${formatarMoeda(totais.despesasVariaveis.gasolina.sugestao)}`}
            value={mes.gasolinaReal}
            onChange={(gasolinaReal) => agendarSalvar({ ...mes, gasolinaReal })}
          />
        </FormularioLeve>
      </Modal>

      <Modal
        aberto={editor === "investimentos"}
        titulo="Ajustar investimentos"
        descricao="A poupança segue 10% do saldo até você editar."
        onClose={() => setEditor(null)}
      >
        <FormularioLeve
          resumo={`Aportes deste mês: ${formatarMoeda(mes.fundoReal + mes.alttabReal + mesComPoupanca.poupancaReal)}. Salva sozinho.`}
        >
          <CampoMoeda
            id="fundoReal"
            label="Fundo imobiliário, real"
            hint={`Sugestão ${formatarMoeda(totais.investimentos.fundo.sugestao)}`}
            value={mes.fundoReal}
            onChange={(fundoReal) => agendarSalvar({ ...mes, fundoReal })}
          />
          <CampoMoeda
            id="alttabReal"
            label="Alttab, real"
            hint={`Sugestão ${formatarMoeda(totais.investimentos.alttab.sugestao)}`}
            value={mes.alttabReal}
            onChange={(alttabReal) => agendarSalvar({ ...mes, alttabReal })}
          />
          <CampoMoeda
            id="poupancaReal"
            label="Poupança, real"
            hint="10% do saldo, até você editar"
            value={mesComPoupanca.poupancaReal}
            onChange={(poupancaReal) => agendarSalvar({ ...mes, poupancaReal, poupancaEditado: true })}
          />
        </FormularioLeve>
      </Modal>
    </article>
  );
}

function BarraKpi({
  rotulo,
  valor,
  percentual,
  tom,
}: {
  rotulo: string;
  valor: number;
  percentual: number;
  tom: "inflow" | "outflow";
}) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-mute">{rotulo}</span>
        <span className="money font-medium">{formatarMoeda(valor)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/70" aria-hidden="true">
        <div
          className={tom === "inflow" ? "h-1.5 bg-inflow" : "h-1.5 bg-outflow"}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}

function LinhaInvestimento({
  rotulo,
  real,
  sugestao,
  variacao,
}: {
  rotulo: string;
  real: number;
  sugestao: number;
  variacao: number;
}) {
  return (
    <li className="border-t border-line pt-2.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{rotulo}</span>
        <span className="money font-medium">{formatarMoeda(real)}</span>
      </div>
      <p className="mt-0.5 text-xs text-mute">Sugestão {formatarMoeda(sugestao)}</p>
      <p className={`money text-xs ${classeVariacao(variacao)}`}>{formatarVariacao(variacao)}</p>
    </li>
  );
}
