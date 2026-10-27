"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarraMeta } from "@/components/barra-meta";
import { Bloco } from "@/components/bloco";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { CampoMes } from "@/components/campo-mes";
import { FaixaRendimento } from "@/components/faixa-rendimento";
import { NotaMes } from "@/components/nota-mes";
import { PainelContas } from "@/components/painel-contas";
import { PainelEmprestimoMeta } from "@/components/painel-emprestimo-meta";
import { useMesEditavel } from "@/components/use-mes-editavel";
import type { ContaComProgresso } from "@/lib/application/conta-mapper";
import type { LinhaMeta } from "@/lib/application/dashboard-visao";
import type { EmprestimoMetaComSituacao } from "@/lib/application/emprestimo-meta-mapper";
import type { MesDTO } from "@/lib/application/mes-mapper";
import { formatarCompetenciaCurta } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

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
  metas?: LinhaMeta[];
  gastoPessoalMes?: number | null;
  reposicaoMeta?: number;
  cartaoFixo?: number;
  emprestimosPoupanca?: EmprestimoMetaComSituacao[];
  abrirNovo?: string | null;
};

export function PainelInvestimentos({
  mesInicial,
  faturaCartao = 0,
  contas,
  historico = [],
  metas = [],
  gastoPessoalMes,
  reposicaoMeta,
  cartaoFixo = 0,
  emprestimosPoupanca = [],
  abrirNovo = null,
}: Props) {
  const router = useRouter();
  const { mes, totais, somenteLeitura, status, sujo, salvar, agendarSalvar } = useMesEditavel({
    mesInicial,
    faturaCartao,
    gastoPessoalMes,
    reposicaoMeta,
    cartaoFixo,
  });

  const poupancaReal = mes.poupancaEditado ? mes.poupancaReal : totais.investimentos.poupanca.sugestao;
  const fundo = totais.investimentos.fundo;

  const irPara = (competencia: string) => {
    if (sujo && !mes.fechado) salvar();
    router.push(`/investimentos?mes=${competencia}`);
  };

  return (
    <div>
      <CabecaPagina
        titulo="Investimentos"
        nota="Poupança, fundo, meta e Alttab. O valor do mês se lança aqui; o estoque fica nas contas."
        acao={<CampoMes id="mes-investimentos" label="Mês" value={mes.competencia} onChange={irPara} />}
      />

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <dl className="rito-faixa mt-6">
        <div>
          <dt>Aporte neste mês</dt>
          <dd className="amount">{formatarMoeda(totais.investimentos.totalInvestido)}</dd>
        </div>
        <div>
          <dt>Para a meta</dt>
          <dd className={`amount ${totais.distribuicao.metaFinal > 0.005 ? "text-inflow" : "text-mute"}`}>
            {formatarMoeda(totais.distribuicao.metaFinal)}
          </dd>
        </div>
        <div>
          <dt>Próximo investimento</dt>
          <dd className={`amount ${fundo.proximo > 0.005 ? "text-inflow" : "text-mute"}`}>
            {formatarMoeda(fundo.proximo)}
          </dd>
        </div>
      </dl>

      {totais.rendimento.apertado ? (
        <p className="rito-aperto mt-3">Mês apertado: rendimento foi para as contas. Sem aporte se não der.</p>
      ) : null}

      <div className="invest-grade">
        <div className="invest-trabalho">
          <div className="mt-8">
            <NotaMes
              mes={mes}
              faturaCartao={faturaCartao}
              totais={totais}
              metas={metas}
              superficie="investimentos"
              onToggle={() => undefined}
              onSalvarConta={() => undefined}
              onSalvarItem={() => undefined}
              onSalvarCampo={(campo, valor) =>
                agendarSalvar(
                  campo === "poupancaReal"
                    ? { ...mes, poupancaReal: valor, poupancaEditado: true }
                    : { ...mes, [campo]: valor },
                )
              }
              somenteLeitura={somenteLeitura}
            />
          </div>

          {totais.rendimento.total >= 0.005 ? (
            <div className="mt-8">
              <FaixaRendimento destino={totais.rendimento} />
            </div>
          ) : null}
        </div>

        <aside className="invest-estoque mt-8">
          <Bloco
            id="invest-metas"
            titulo="Estoque"
            nota="O que já está junto, não o aporte deste mês."
            acao={
              <Link className="text-sm text-mute hover:underline" href="/contas">
                Cadastro
              </Link>
            }
          >
            {metas.length === 0 ? (
              <p className="text-sm text-mute">
                Cadastrem o objetivo da meta em{" "}
                <Link className="underline" href="/contas">
                  Cadastros
                </Link>
                .
              </p>
            ) : (
              <ul className="grid gap-3">
                {metas.map((meta) => (
                  <li key={meta.id}>
                    <Link href={meta.href} className="kpi is-meta">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="kpi-rotulo">{meta.rotulo}</p>
                        <p className="text-sm text-mute">{meta.detalhe}</p>
                      </div>
                      <p className="amount kpi-valor mt-2">{formatarMoeda(meta.progresso.saldo)}</p>
                      <div className="mt-3">
                        <BarraMeta nome={meta.rotulo} progresso={meta.progresso} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Bloco>
        </aside>
      </div>

      <PainelContas
        contas={contas}
        finalidades={["INVESTIMENTO", "POUPANCA"]}
        finalidadePadrao="INVESTIMENTO"
        abrirNovo={abrirNovo === "conta"}
        titulo="Onde o dinheiro fica"
        nota="Investimento fica travado. Poupança é renda que pode sair quando precisar."
        vazio="Nenhuma conta de investimento ainda. Cadastre fundo ou poupança."
      />

      <PainelEmprestimoMeta
        emprestimos={emprestimosPoupanca}
        contas={contas.filter((conta) => conta.finalidade === "POUPANCA")}
        sobraMes={totais.distribuicao.metaFinal}
        abrirNovo={abrirNovo === "saque"}
        titulo="Retirada da poupança"
        nota="O valor sai agora. O sistema sugere em quantas vezes repor para o mês não ficar negativo."
      />

      <Bloco titulo="Histórico de aportes" nota="Para comparar o que foi investido nos últimos meses.">
        {historico.length === 0 ? (
          <p className="text-sm text-mute">Ainda não há meses para comparar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
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
          </div>
        )}
      </Bloco>
    </div>
  );
}
