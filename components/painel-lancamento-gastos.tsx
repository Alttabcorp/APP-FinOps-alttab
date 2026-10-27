"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bloco } from "@/components/bloco";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { CampoMes } from "@/components/campo-mes";
import { ListaItens } from "@/components/lista-itens";
import { NavCadastros } from "@/components/nav-cadastros";
import { Modal } from "@/components/modal";
import { RelatorioGastos } from "@/components/painel-gastos";
import { useMesEditavel } from "@/components/use-mes-editavel";
import type { carregarGastos } from "@/lib/application/carregar-gastos";
import { formatarCompetencia } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

type Dados = NonNullable<Awaited<ReturnType<typeof carregarGastos>>>;

type Props = {
  dados: Dados;
};

export function PainelLancamentoGastos({ dados }: Props) {
  const { dto: mesInicial, faturaCartao = 0, gastoPessoalMes = null, reposicaoMeta = 0, cartaoFixo = 0 } = dados;
  const router = useRouter();
  const { mes, somenteLeitura, status, sujo, salvar, atualizarItens } = useMesEditavel({
    mesInicial,
    faturaCartao,
    gastoPessoalMes,
    reposicaoMeta,
    cartaoFixo,
  });
  const [relatorio, setRelatorio] = useState(false);
  const contas = mes.itens.filter((item) => item.tipo === "CONTA");
  const total = contas.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  const irPara = (competencia: string) => {
    if (sujo && !mes.fechado) salvar();
    router.push(`/gastos?mes=${competencia}`);
  };

  return (
    <article>
      <NavCadastros />
      <CabecaPagina
        titulo="Contas que se repetem"
        nota="Internet, energia, IPTV. O valor do mês se lança no Início quando a conta chega."
        acao={
          <div className="flex flex-wrap items-end gap-2">
            <CampoMes id="mes-gastos" label="Mês" value={mes.competencia} onChange={irPara} />
            <button className="btn text-sm" type="button" onClick={() => setRelatorio(true)}>
              Relatório
            </button>
          </div>
        }
      />

      <Bloco
        titulo="Contas fixas"
        nota={
          somenteLeitura
            ? "Mês fechado. Reabra no Início para alterar as contas."
            : formatarCompetencia(mes.competencia)
        }
        figura={
          contas.length === 0 ? undefined : (
            <>
              <p className="bloco-figura-rotulo">
                {contas.length} {contas.length === 1 ? "conta" : "contas"}
              </p>
              <p className="amount">{formatarMoeda(total)}</p>
            </>
          )
        }
      >
        {somenteLeitura ? (
          contas.length === 0 ? (
            <p className="vazio">Nenhuma conta fixa neste mês.</p>
          ) : (
            <ul>
              {contas.map((item, indice) => (
                <li
                  key={`${item.nome}-${indice}`}
                  className="flex items-baseline justify-between gap-3 border-t border-line py-2 text-sm first:border-t-0 first:pt-0"
                >
                  <span className="min-w-0 truncate">{item.nome || "Sem nome"}</span>
                  <span className="money shrink-0">{formatarMoeda(item.valor)}</span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ListaItens
            titulo="Contas fixas"
            tipo="CONTA"
            itens={contas}
            onChange={(itens) => atualizarItens("CONTA", itens)}
          />
        )}
      </Bloco>
      <p className="mt-4 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={relatorio}
        titulo="Relatório de gastos"
        descricao="Comparativo dos meses e onde saiu mais."
        onClose={() => setRelatorio(false)}
        largura="lg"
      >
        <RelatorioGastos dados={dados} />
      </Modal>
    </article>
  );
}
