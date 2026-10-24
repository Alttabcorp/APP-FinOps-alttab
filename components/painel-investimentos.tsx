"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CampoMes } from "@/components/campo-mes";
import { CampoMoeda } from "@/components/campo-moeda";
import { FormularioLeve } from "@/components/formulario-modal";
import { FaixaRendimento } from "@/components/faixa-rendimento";
import { classeVariacao } from "@/components/comparativo-valores";
import { PainelContas } from "@/components/painel-contas";
import { useMesEditavel } from "@/components/use-mes-editavel";
import type { ContaComProgresso } from "@/lib/application/conta-mapper";
import type { MesDTO } from "@/lib/application/mes-mapper";
import { formatarCompetenciaCurta } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda, formatarVariacao } from "@/lib/formatacao";

type HistoricoAporte = {
  competencia: string;
  fundo: number;
  alttab: number;
  poupanca: number;
  total: number;
};

type Props = {
  mesInicial: MesDTO;
  faturaCartao?: number;
  contas: ContaComProgresso[];
  historico?: HistoricoAporte[];
  abrirNovo?: string | null;
};

export function PainelInvestimentos({
  mesInicial,
  faturaCartao = 0,
  contas,
  historico = [],
  abrirNovo = null,
}: Props) {
  const router = useRouter();
  const { mes, totais, somenteLeitura, status, sujo, salvar, agendarSalvar } = useMesEditavel({
    mesInicial,
    faturaCartao,
  });

  useEffect(() => {
    if (abrirNovo === "aporte") {
      document.getElementById("aporte")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [abrirNovo]);

  const poupancaReal = mes.poupancaEditado ? mes.poupancaReal : totais.investimentos.poupanca.sugestao;

  const irPara = (competencia: string) => {
    if (sujo && !mes.fechado) salvar();
    router.push(`/investimentos?mes=${competencia}`);
  };

  return (
    <div>
      <div className="flex justify-end">
        <CampoMes id="mes-investimentos" label="Mês" value={mes.competencia} onChange={irPara} />
      </div>

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <section id="aporte" className="mt-6 border-t border-line pt-4">
        <p className="text-sm text-mute">Aporte neste mês</p>
        <p className="amount mt-1 text-[1.85rem]">{formatarMoeda(totais.investimentos.totalInvestido)}</p>
        <p className="mt-2 max-w-[46ch] text-sm text-mute">
          Investimento em ações não sai. Poupança pode sacar. A poupança segue 10% do saldo até você editar.
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          <Linha
            rotulo="Fundo imobiliário"
            real={mes.fundoReal}
            sugestao={totais.investimentos.fundo.sugestao}
            variacao={totais.investimentos.fundo.variacao}
          />
          <Linha
            rotulo="Alttab"
            real={mes.alttabReal}
            sugestao={totais.investimentos.alttab.sugestao}
            variacao={totais.investimentos.alttab.variacao}
          />
          <Linha
            rotulo="Poupança"
            real={poupancaReal}
            sugestao={totais.investimentos.poupanca.sugestao}
            variacao={totais.investimentos.poupanca.variacao}
          />
        </ul>

        {somenteLeitura ? (
          <p className="mt-4 text-sm text-mute">Mês fechado. Reabra na visão do mês para alterar o aporte.</p>
        ) : (
          <div className="mt-6">
            <FormularioLeve
              resumo={`Aportes deste mês: ${formatarMoeda(mes.fundoReal + mes.alttabReal + poupancaReal)}. ${
                sujo ? "Salvando…" : "Salva sozinho."
              }`}
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
                value={poupancaReal}
                onChange={(poupanca) => agendarSalvar({ ...mes, poupancaReal: poupanca, poupancaEditado: true })}
              />
            </FormularioLeve>
          </div>
        )}

        {totais.rendimento.total >= 0.005 ? (
          <div className="mt-8">
            <FaixaRendimento destino={totais.rendimento} />
          </div>
        ) : null}
      </section>

      <section className="mt-10 overflow-x-auto border-t border-line pt-5">
        <h2 className="titulo-secao">Histórico de aportes</h2>
        <p className="mt-1 text-sm text-mute">Para comparar o que foi investido nos últimos meses.</p>
        {historico.length === 0 ? (
          <p className="mt-4 text-sm text-mute">Ainda não há meses para comparar.</p>
        ) : (
          <table className="mt-5 min-w-full text-left text-sm">
            <caption className="sr-only">Aportes nos últimos meses</caption>
            <thead>
              <tr className="text-mute">
                <th className="pb-2 pr-4 font-medium" scope="col">
                  Mês
                </th>
                <th className="pb-2 pr-4 font-medium" scope="col">
                  Fundo
                </th>
                <th className="pb-2 pr-4 font-medium" scope="col">
                  Alttab
                </th>
                <th className="pb-2 pr-4 font-medium" scope="col">
                  Poupança
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
                    <td className="money py-2.5 pr-4">{formatarMoeda(atual ? mes.fundoReal : linha.fundo)}</td>
                    <td className="money py-2.5 pr-4">{formatarMoeda(atual ? mes.alttabReal : linha.alttab)}</td>
                    <td className="money py-2.5 pr-4">{formatarMoeda(atual ? poupancaReal : linha.poupanca)}</td>
                    <td className="money py-2.5 font-medium">
                      {formatarMoeda(atual ? totais.investimentos.totalInvestido : linha.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-10">
        <h2 className="titulo-secao">Onde o dinheiro fica</h2>
        <p className="mt-1 max-w-[42ch] text-sm text-mute">
          Investimento fica travado. Poupança é renda que pode sair quando precisar.
        </p>
        <div className="mt-4">
          <PainelContas
            contas={contas}
            finalidades={["INVESTIMENTO", "POUPANCA"]}
            finalidadePadrao="INVESTIMENTO"
            abrirNovo={abrirNovo === "conta"}
            vazio="Nenhuma conta de investimento ainda. Cadastre fundo ou poupança."
          />
        </div>
      </section>
    </div>
  );
}

function Linha({
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
    <li className="border-t border-line pt-3">
      <p className="text-sm text-mute">{rotulo}</p>
      <p className="money mt-1 text-xl font-medium">{formatarMoeda(real)}</p>
      <p className="mt-1 text-xs text-mute">Sugestão {formatarMoeda(sugestao)}</p>
      <p className={`money text-xs ${classeVariacao(variacao)}`}>{formatarVariacao(variacao)}</p>
    </li>
  );
}
