"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CampoMes } from "@/components/campo-mes";
import { ListaItens } from "@/components/lista-itens";
import { Modal } from "@/components/modal";
import { PainelRendas } from "@/components/painel-rendas";
import { ResumoGrupo } from "@/components/resumo-grupo";
import { useMesEditavel } from "@/components/use-mes-editavel";
import type { carregarEntradas } from "@/lib/application/carregar-entradas";
import {
  formatarCompetencia,
  formatarCompetenciaCurta,
  formatarNomeMes,
} from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

type Dados = NonNullable<Awaited<ReturnType<typeof carregarEntradas>>>;
type Editor = "saldo" | "extra" | "historico" | null;

type Props = {
  dados: Dados;
  abrirNovo?: string | null;
};

export function PainelEntradas({ dados, abrirNovo = null }: Props) {
  const { dto, faturaCartao, gastoPessoalMes, reposicaoMeta, rendas, historico } = dados;
  const router = useRouter();
  const { mes, totais, somenteLeitura, status, sujo, salvar, porTipo, atualizarItens } = useMesEditavel({
    mesInicial: dto,
    faturaCartao,
    gastoPessoalMes,
    reposicaoMeta,
  });
  const [editor, setEditor] = useState<Editor>(null);
  const anterior = historico.filter((linha) => linha.competencia < mes.competencia).at(-1);

  const irPara = (competencia: string) => {
    if (sujo && !mes.fechado) salvar();
    router.push(`/entradas?mes=${competencia}`);
  };

  return (
    <article className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Entradas</h1>
          <p className="mt-2 max-w-[42ch] text-sm text-mute">
            Informe o que entrou em {formatarCompetencia(mes.competencia)}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <CampoMes id="mes-entradas" label="Mês" value={mes.competencia} onChange={irPara} />
          <button className="btn text-sm" type="button" onClick={() => setEditor("historico")}>
            Comparar meses
          </button>
        </div>
      </header>

      <section className="kpi is-principal mt-6 max-w-xl">
        <p className="kpi-rotulo">Entrou neste mês</p>
        <div>
          <p className="amount kpi-valor text-inflow">{formatarMoeda(totais.resumo.ganhou)}</p>
          <p className="mt-3 text-sm text-mute">
            {somenteLeitura
              ? "Mês fechado. Reabra na visão do mês para alterar."
              : anterior
                ? `${formatarNomeMes(anterior.competencia)}: ${formatarMoeda(anterior.total)}.`
                : "Altere os valores nos blocos. Salva sozinho."}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <ResumoGrupo
          titulo="Dinheiro"
          tom="inflow"
          acao="Alterar valores"
          itens={porTipo("SALDO")}
          onEditar={() => setEditor("saldo")}
          somenteLeitura={somenteLeitura}
        />
        <ResumoGrupo
          titulo="Vales e rendimento"
          tom="inflow"
          acao="Alterar valores"
          itens={porTipo("EXTRA")}
          onEditar={() => setEditor("extra")}
          somenteLeitura={somenteLeitura}
        />
      </section>

      {totais.rendimento.total >= 0.005 ? (
        <p className="mt-3 text-sm text-mute">
          {totais.rendimento.apertado
            ? `Rendimento ${formatarMoeda(totais.rendimento.total)}: parte nas contas, o resto reinveste.`
            : `Rendimento ${formatarMoeda(totais.rendimento.total)} reinvestido.`}
        </p>
      ) : null}

      <div className="mt-6">
        <PainelRendas rendas={rendas} abrirNovo={abrirNovo} />
      </div>

      <p className="mt-4 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={editor === "saldo"}
        titulo="Valores em dinheiro"
        descricao="Empregos e bicos deste mês. Uma fonte nova se cadastra no bloco Fontes."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <ListaItens
          titulo="Dinheiro"
          tipo="SALDO"
          itens={porTipo("SALDO")}
          onChange={(itens) => atualizarItens("SALDO", itens)}
        />
      </Modal>

      <Modal
        aberto={editor === "extra"}
        titulo="Vales e rendimento"
        descricao="VA fica na feira. VT entra no caixa. Rendimento reinveste; se o mês apertar, paga as contas."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <ListaItens
          titulo="Vales e rendimento"
          tipo="EXTRA"
          comPapel
          itens={porTipo("EXTRA")}
          onChange={(itens) => atualizarItens("EXTRA", itens)}
        />
      </Modal>

      <Modal
        aberto={editor === "historico"}
        titulo="Comparar entradas"
        descricao="O que entrou nos últimos meses."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        {historico.length === 0 ? (
          <p className="text-sm text-mute">Ainda não há meses para comparar.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">Entradas nos últimos meses</caption>
            <thead>
              <tr className="text-mute">
                <th className="pb-2 pr-4 font-medium" scope="col">
                  Mês
                </th>
                <th className="pb-2 pr-4 font-medium" scope="col">
                  Dinheiro
                </th>
                <th className="pb-2 pr-4 font-medium" scope="col">
                  Vales e rendimento
                </th>
                <th className="pb-2 font-medium" scope="col">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {historico.map((linha) => {
                const atual = linha.competencia === mes.competencia;
                return (
                  <tr key={linha.competencia} className="border-t border-line">
                    <th className="py-2.5 pr-4 font-medium" scope="row">
                      {formatarCompetenciaCurta(linha.competencia)}
                      {atual ? <span className="ml-2 text-xs font-normal text-mute">este mês</span> : null}
                    </th>
                    <td className="money py-2.5 pr-4">
                      {formatarMoeda(atual ? somar(porTipo("SALDO")) : linha.dinheiro)}
                    </td>
                    <td className="money py-2.5 pr-4">
                      {formatarMoeda(atual ? somar(porTipo("EXTRA")) : linha.valesRendimento)}
                    </td>
                    <td className="money py-2.5 font-medium">
                      {formatarMoeda(atual ? totais.resumo.ganhou : linha.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Modal>
    </article>
  );
}

function somar(itens: { valor: number }[]) {
  return itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
}
