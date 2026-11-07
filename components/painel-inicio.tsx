"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BotaoEntrada } from "@/components/botao-entrada";
import { marcarDepositoAction, salvarMesAction } from "@/app/actions/mes";
import { ehAPagar } from "@/lib/application/checklist";
import type { MesDTO } from "@/lib/application/mes-mapper";
import { avancarCompetencia, formatarCompetencia } from "@/lib/domain/financeiro/competencia";
import type { CampoMarca } from "@/lib/domain/financeiro/transferencia";
import { formatarMoeda, formatarPercentual } from "@/lib/formatacao";

type Props = {
  competencia: string;
  mes: MesDTO;
  ganhou: number;
  gasto: number;
  gastoContas: number;
  sobrou: number;
  tetoCartao: number;
  faturaCartao: number;
  poupancaSugerida: number;
  aportes: { poupanca: number; fundo: number; alttab: number; meta: number };
  sugestoes: { poupanca: number; fundo: number; alttab: number; meta: number };
  contas: { id: string; nome: string }[];
  meta: { nome: string; saldo: number; objetivo: number };
};

type Linha = { id: string; rotulo: string; valor: number; feito: boolean; grupo: string; sugerido?: number };

const TEM = (valor: number) => Math.abs(valor) >= 0.005;

export function PainelInicio({
  competencia,
  mes: mesInicial,
  ganhou,
  gasto,
  gastoContas,
  sobrou,
  tetoCartao,
  faturaCartao,
  poupancaSugerida,
  aportes,
  sugestoes,
  contas: caixinhas,
  meta,
}: Props) {
  const [mes, setMes] = useState(mesInicial);
  const [erro, setErro] = useState("");
  const [, startTransition] = useTransition();

  const contas: Linha[] = mes.itens
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => ehAPagar(item.tipo) && TEM(item.valor))
    .map(({ item, indice }) => ({
      id: `item:${indice}`,
      rotulo: item.nome || "Sem nome",
      valor: item.valor,
      feito: item.pago,
      grupo: "Contas",
    }));

  const outras: Linha[] = [
    { id: "cartao", rotulo: "Fatura do cartão", valor: faturaCartao, feito: mes.depositos.cartao, grupo: "Cartão" },
    { id: "poupanca", rotulo: "Poupança", valor: aportes.poupanca, sugerido: sugestoes.poupanca, feito: mes.depositos.poupanca, grupo: "Investimentos" },
    { id: "fundo", rotulo: "Fundo imobiliário", valor: aportes.fundo, sugerido: sugestoes.fundo, feito: mes.depositos.fundo, grupo: "Investimentos" },
    { id: "alttab", rotulo: "Alttab", valor: aportes.alttab, sugerido: sugestoes.alttab, feito: mes.depositos.alttab, grupo: "Investimentos" },
    { id: "meta", rotulo: `Objetivo (${meta.nome})`, valor: aportes.meta, sugerido: sugestoes.meta, feito: mes.depositos.meta, grupo: "Investimentos" },
  ].filter((linha) => TEM(linha.valor));

  const linhas = [...contas, ...outras];
  const feitos = linhas.filter((linha) => linha.feito).length;
  const grupos = ["Contas", "Cartão", "Investimentos"].map((nome) => ({
    nome,
    linhas: linhas.filter((linha) => linha.grupo === nome),
  }));

  const alternar = (linha: Linha, feito: boolean) => {
    if (mes.fechado) return;
    setErro("");
    const anterior = mes;
    if (linha.id.startsWith("item:")) {
      const indice = Number(linha.id.slice(5));
      const proximo = {
        ...mes,
        itens: mes.itens.map((item, i) => (i === indice ? { ...item, pago: feito } : item)),
      };
      setMes(proximo);
      startTransition(async () => {
        const resposta = await salvarMesAction(proximo);
        if (!resposta.ok) {
          setMes(anterior);
          setErro(resposta.erro);
        }
      });
      return;
    }
    const campo = linha.id as CampoMarca;
    setMes({ ...mes, depositos: { ...mes.depositos, [campo]: feito } });
    startTransition(async () => {
      const resposta = await marcarDepositoAction(competencia, campo, feito);
      if (!resposta.ok) {
        setMes(anterior);
        setErro(resposta.erro);
      }
    });
  };

  const pctMeta = meta.objetivo > 0 ? Math.min(100, Math.max(0, (meta.saldo / meta.objetivo) * 100)) : 0;
  const estouro = faturaCartao > tetoCartao + 0.005;
  const pctCartao = tetoCartao > 0 ? Math.min(100, (faturaCartao / tetoCartao) * 100) : faturaCartao > 0 ? 100 : 0;

  return (
    <article className="mx-auto max-w-[72rem] px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">{formatarCompetencia(competencia)}</h1>
          <p className="mt-2 text-sm text-mute">
            {mes.fechado ? "Mês fechado (somente leitura)." : "Resumo do mês e o que falta pagar."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn" href={`/?mes=${avancarCompetencia(competencia, -1)}`} aria-label="Mês anterior">
            ‹
          </Link>
          <Link className="btn" href={`/?mes=${avancarCompetencia(competencia, 1)}`} aria-label="Próximo mês">
            ›
          </Link>
          <Link className="btn" href={`/despesas?mes=${competencia}&add=feira`}>
            + Feira
          </Link>
          <Link className="btn" href={`/despesas?mes=${competencia}&add=gasolina`}>
            + Gasolina
          </Link>
          <Link className="btn" href="/transacoes">
            Transações
          </Link>
        </div>
      </header>

      <section className="resumo-faixa mt-5" aria-label="Resumo do mês">
        <Link
          href={`/ganhos?mes=${competencia}`}
          className="resumo-celula is-principal text-inherit no-underline"
          aria-label="Ver e adicionar os ganhos do mês"
        >
          <p className="kpi-rotulo">Ganhou no mês</p>
          <p className="amount resumo-valor text-inflow">{formatarMoeda(ganhou)}</p>
          <p className={`text-xs ${sobrou >= 0 ? "text-inflow" : "text-outflow"}`}>
            Sobra prevista {formatarMoeda(sobrou)}
          </p>
          <p className="mt-1 text-xs text-mute">Ver e adicionar entradas →</p>
        </Link>
        <Link
          href={`/despesas?mes=${competencia}`}
          className="resumo-celula text-inherit no-underline"
          aria-label="Ver e adicionar os gastos do mês"
        >
          <p className="kpi-rotulo">Gasto do mês</p>
          <p className="money resumo-valor-sm text-outflow">{formatarMoeda(gasto)}</p>
          <p className="text-xs text-mute">Contas {formatarMoeda(gastoContas)} + cartão + aportes</p>
          <p className="mt-1 text-xs text-mute">Ver e adicionar gastos →</p>
        </Link>
        <Link
          href={`/cartao?mes=${competencia}`}
          className="resumo-celula text-inherit no-underline"
          aria-label="Ver o cartão do mês"
        >
          <p className="kpi-rotulo">Teto do cartão</p>
          <p className="money resumo-valor-sm">{formatarMoeda(tetoCartao)}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/70" aria-hidden="true">
            <div className={`h-1.5 ${estouro ? "bg-outflow" : "bg-inflow"}`} style={{ width: `${pctCartao}%` }} />
          </div>
          <p className={`mt-1 text-xs ${estouro ? "text-outflow" : "text-mute"}`}>
            Fatura {formatarMoeda(faturaCartao)}
            {estouro ? " · passou do teto" : ""}
          </p>
          <p className="mt-1 text-xs text-mute">Ver o cartão →</p>
        </Link>
        <div className="resumo-celula">
          <p className="kpi-rotulo">Sugestão para poupança</p>
          <p className="money resumo-valor-sm">{formatarMoeda(poupancaSugerida)}</p>
          <p className="text-xs text-mute">10% do saldo + rendimento</p>
        </div>
      </section>

      <Link
        href="/objetivos"
        className="panel panel-accent mt-6 block p-5 text-inherit no-underline"
        aria-label="Ver todos os objetivos"
      >
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Objetivo de {formatarMoeda(meta.objetivo)}</h2>
          <p className="money text-sm">
            {formatarMoeda(meta.saldo)} <span className="text-mute">de {formatarMoeda(meta.objetivo)}</span>
          </p>
        </header>
        <div
          className="barra-meta is-grande mt-3"
          role="progressbar"
          aria-label={`Progresso do objetivo: ${formatarPercentual(pctMeta)}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pctMeta)}
        >
          <div className={`barra-meta-fill ${pctMeta >= 100 ? "is-completa" : ""}`} style={{ width: `${pctMeta}%` }} />
        </div>
        <p className="mt-2 flex justify-between text-sm">
          <span className="money font-medium">{formatarPercentual(pctMeta)}</span>
          <span className="text-mute">
            {meta.saldo >= meta.objetivo ? "Objetivo atingido" : `faltam ${formatarMoeda(meta.objetivo - meta.saldo)}`}
          </span>
        </p>
        <p className="mt-2 text-xs text-mute">Ver todos os objetivos →</p>
      </Link>

      <section className="panel mt-6 p-5" aria-label="Checklist do mês">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">O que já foi pago</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm text-mute">
              {feitos} de {linhas.length}
            </p>
            <BotaoEntrada contas={caixinhas} rotulo="Entrada extra" />
          </div>
        </header>
        {erro ? (
          <p className="mt-2 text-sm text-outflow" role="alert">
            {erro}
          </p>
        ) : null}
        {linhas.length === 0 ? (
          <p className="mt-4 text-sm text-mute">Nada para pagar neste mês. Cadastre contas em “Detalhes do mês”.</p>
        ) : (
          grupos
            .filter((grupo) => grupo.linhas.length > 0)
            .map((grupo) => (
              <div key={grupo.nome} className="mt-4">
                <h3 className="kpi-rotulo">{grupo.nome}</h3>
                <ul>
                  {grupo.linhas.map((linha) => {
                    const id = `inicio-${linha.id}`;
                    return (
                      <li key={linha.id} className="border-b border-line last:border-b-0">
                        <label
                          htmlFor={id}
                          className={`flex items-center gap-3 py-3 ${mes.fechado ? "" : "cursor-pointer"} ${
                            linha.feito ? "text-mute" : ""
                          }`}
                        >
                          <input
                            id={id}
                            className="checkbox-pago shrink-0"
                            type="checkbox"
                            checked={linha.feito}
                            disabled={mes.fechado}
                            onChange={(evento) => alternar(linha, evento.target.checked)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate ${linha.feito ? "line-through" : ""}`}>{linha.rotulo}</span>
                            {linha.sugerido !== undefined ? (
                              <span className="block text-xs text-mute no-underline">
                                Sugerido {formatarMoeda(linha.sugerido)}
                                {Math.abs(linha.sugerido - linha.valor) >= 0.005 ? " · você ajustou o valor" : ""}
                              </span>
                            ) : null}
                          </span>
                          <span className="money shrink-0 text-sm">{formatarMoeda(linha.valor)}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
        )}
      </section>
    </article>
  );
}
