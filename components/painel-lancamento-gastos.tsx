"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CampoMes } from "@/components/campo-mes";
import { CampoMoeda } from "@/components/campo-moeda";
import { ChecklistPagar } from "@/components/checklist-pagar";
import { FaixaGastoPessoal } from "@/components/faixa-metas";
import { ListaItens } from "@/components/lista-itens";
import { Modal } from "@/components/modal";
import { RelatorioGastos } from "@/components/painel-gastos";
import { useMesEditavel } from "@/components/use-mes-editavel";
import type { carregarGastos } from "@/lib/application/carregar-gastos";
import type { ItemDTO } from "@/lib/application/mes-mapper";
import { formatarCompetencia, formatarNomeMes } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

type Dados = NonNullable<Awaited<ReturnType<typeof carregarGastos>>>;
type Editor = "contas" | "extraMes" | "relatorio" | null;

type Props = {
  dados: Dados;
};

export function PainelLancamentoGastos({ dados }: Props) {
  const {
    dto: mesInicial,
    faturaCartao = 0,
    gastoPessoalMes = null,
    reposicaoMeta = 0,
    parcelasCartao = [],
    historico,
    analise,
  } = dados;
  const router = useRouter();
  const { mes, totais, somenteLeitura, status, sujo, salvar, atualizarItens, marcarPago, agendarSalvar } =
    useMesEditavel({
      mesInicial,
      faturaCartao,
      gastoPessoalMes,
      reposicaoMeta,
    });
  const [editor, setEditor] = useState<Editor>(null);
  const anterior = historico.filter((linha) => linha.competencia < mes.competencia).at(-1);
  const nomeAnterior = anterior ? formatarNomeMes(anterior.competencia) : null;

  const irPara = (competencia: string) => {
    if (sujo && !mes.fechado) salvar();
    router.push(`/gastos?mes=${competencia}`);
  };

  return (
    <article>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Gastos</h1>
          <p className="mt-2 max-w-[46ch] text-sm text-mute">
            Informe o que saiu em {formatarCompetencia(mes.competencia)}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <CampoMes id="mes-gastos" label="Mês" value={mes.competencia} onChange={irPara} />
          <button className="btn text-sm" type="button" onClick={() => setEditor("relatorio")}>
            Relatório
          </button>
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Resumo do mês">
        <div className="kpi is-principal">
          <p className="kpi-rotulo">Gastou neste mês</p>
          <div>
            <p className="amount kpi-valor text-outflow">{formatarMoeda(totais.resumo.gasto)}</p>
            <p className="mt-3 text-sm text-mute">
              {somenteLeitura
                ? "Mês fechado. Reabra na visão do mês para alterar."
                : analise.maior && analise.maior.valor > 0.005
                  ? `O maior foi ${analise.maior.rotulo.toLowerCase()}: ${formatarMoeda(analise.maior.valor)}.`
                  : "Marque o pago e informe feira, gasolina e extra. Salva sozinho."}
            </p>
          </div>
        </div>
        <div className="kpi is-principal">
          <p className="kpi-rotulo">Para a meta</p>
          <div>
            <p
              className={`amount kpi-valor ${
                totais.distribuicao.metaFinal >= 0.005 ? "text-inflow" : "text-mute"
              }`}
            >
              {formatarMoeda(totais.distribuicao.metaFinal)}
            </p>
            <p className="mt-3 text-sm text-mute">
              {totais.distribuicao.metaFinal >= 0.005
                ? "O que sobra depois do gasto pessoal."
                : "Não sobrou para a meta neste mês."}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-4">
        <FaixaGastoPessoal
          gastoPessoal={totais.distribuicao.gastoPessoal}
          gastoPessoalAlvo={gastoPessoalMes}
          sugestaoMetaMes={totais.distribuicao.metaFinal}
        />
      </div>

      <div className="mt-8">
        <ChecklistPagar
          itens={mes.itens}
          onToggle={marcarPago}
          onEditarContas={() => setEditor("contas")}
          onEditarExtraMes={() => setEditor("extraMes")}
          somenteLeitura={somenteLeitura}
        />
      </div>

      <section id="extra" className="panel panel-outflow mt-6 p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Extra deste mês</h2>
            <p className="mt-1 text-sm text-mute">Ração, água mineral, conserto — o que não se repete todo mês.</p>
          </div>
          {somenteLeitura ? null : (
            <button className="btn shrink-0 text-sm" type="button" onClick={() => setEditor("extraMes")}>
              Adicionar gasto
            </button>
          )}
        </header>
        <ListaResumo itens={mes.itens.filter((item) => item.tipo === "EXTRA_MES")} />
      </section>

      <div id="feira" className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="panel panel-outflow p-5">
          <h2 className="text-lg font-semibold">Feira e gasolina</h2>
          {somenteLeitura ? (
            <ul className="mt-4 grid gap-2 text-sm">
              <li className="flex justify-between gap-3 border-t border-line pt-2">
                <span>Feira</span>
                <span className="money">{formatarMoeda(mes.feiraReal)}</span>
              </li>
              <li className="flex justify-between gap-3 border-t border-line pt-2">
                <span>Gasolina</span>
                <span className="money">{formatarMoeda(mes.gasolinaReal)}</span>
              </li>
            </ul>
          ) : (
            <div className="mt-4 grid gap-4">
              <CampoMoeda
                id="feiraReal"
                label="Feira, real"
                hint={dicaCampo({
                  mesAnterior: nomeAnterior,
                  valorAnterior: anterior?.entrada.feira ?? 0,
                  sugestao: totais.despesasVariaveis.feira.sugestao,
                })}
                value={mes.feiraReal}
                onChange={(feiraReal) => agendarSalvar({ ...mes, feiraReal })}
              />
              <CampoMoeda
                id="gasolinaReal"
                label="Gasolina, real"
                hint={dicaCampo({
                  mesAnterior: nomeAnterior,
                  valorAnterior: anterior?.entrada.gasolina ?? 0,
                  sugestao: totais.despesasVariaveis.gasolina.sugestao,
                })}
                value={mes.gasolinaReal}
                onChange={(gasolinaReal) => agendarSalvar({ ...mes, gasolinaReal })}
              />
            </div>
          )}
        </section>

        <section id="cartao" className="panel panel-outflow p-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Cartão</h2>
              <p className="money mt-1 text-xl font-semibold">{formatarMoeda(mes.cartaoReal + faturaCartao)}</p>
            </div>
            <Link className="btn shrink-0 text-sm" href="/cartao">
              Parcelas
            </Link>
          </header>
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
          {somenteLeitura ? null : (
            <div className="mt-4">
              <CampoMoeda
                id="cartaoReal"
                label="Avulso no cartão"
                hint={dicaCampo({
                  mesAnterior: nomeAnterior,
                  valorAnterior: (anterior?.entrada.cartaoAvulso ?? 0) + (anterior?.entrada.faturaCartao ?? 0),
                  sugestao: totais.despesasVariaveis.cartao.sugestao,
                  extra: faturaCartao > 0.005 ? `Parcelas ${formatarMoeda(faturaCartao)}` : undefined,
                })}
                value={mes.cartaoReal}
                onChange={(cartaoReal) => agendarSalvar({ ...mes, cartaoReal })}
              />
            </div>
          )}
        </section>
      </div>

      <p className="mt-4 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={editor === "contas"}
        titulo="Editar contas fixas"
        descricao="Contas que saem todo mês. O extra avulso fica no outro bloco."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <ListaItens
          titulo="Contas fixas"
          tipo="CONTA"
          itens={mes.itens.filter((item) => item.tipo === "CONTA")}
          onChange={(itens) => atualizarItens("CONTA", itens)}
        />
      </Modal>

      <Modal
        aberto={editor === "extraMes"}
        titulo="Adicionar gasto do mês"
        descricao="O que não se repete: ração, água mineral, conserto."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <ListaItens
          titulo="Extra do mês"
          tipo="EXTRA_MES"
          itens={mes.itens.filter((item) => item.tipo === "EXTRA_MES")}
          onChange={(itens) => atualizarItens("EXTRA_MES", itens)}
        />
      </Modal>

      <Modal
        aberto={editor === "relatorio"}
        titulo="Relatório de gastos"
        descricao="Comparativo dos meses e onde saiu mais."
        onClose={() => setEditor(null)}
        largura="lg"
      >
        <RelatorioGastos dados={dados} />
      </Modal>
    </article>
  );
}

function dicaCampo({
  mesAnterior,
  valorAnterior,
  sugestao,
  extra,
}: {
  mesAnterior: string | null;
  valorAnterior: number;
  sugestao?: number;
  extra?: string;
}) {
  const partes: string[] = [];
  if (extra) partes.push(extra);
  if (mesAnterior && valorAnterior > 0.005) {
    partes.push(`${mesAnterior}: ${formatarMoeda(valorAnterior)}`);
  }
  if (sugestao != null && sugestao > 0.005) partes.push(`sugestão ${formatarMoeda(sugestao)}`);
  return partes.length > 0 ? partes.join(" · ") : undefined;
}

function ListaResumo({ itens }: { itens: ItemDTO[] }) {
  const visiveis = itens.filter((item) => item.nome.trim() || Math.abs(Number(item.valor) || 0) > 0.005);
  if (visiveis.length === 0) {
    return <p className="mt-4 text-sm text-mute">Nenhum extra informado neste mês.</p>;
  }
  return (
    <ul className="mt-3">
      {visiveis.map((item, indice) => (
        <li
          key={`${item.nome}-${indice}`}
          className="flex items-baseline justify-between gap-3 border-t border-line py-2 text-sm"
        >
          <span className="min-w-0 truncate">{item.nome || "Sem nome"}</span>
          <span className="money shrink-0">{formatarMoeda(item.valor)}</span>
        </li>
      ))}
    </ul>
  );
}
