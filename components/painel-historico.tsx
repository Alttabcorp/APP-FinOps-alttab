"use client";

import { useState } from "react";
import Link from "next/link";
import { GraficoHistorico, type LinhaHistorico } from "@/components/grafico-historico";
import { Modal } from "@/components/modal";
import { SeloContas } from "@/components/selo-contas";
import { formatarCompetencia, formatarNomeMes } from "@/lib/domain/financeiro/competencia";
import { formatarDeltaMes, formatarMoeda } from "@/lib/formatacao";

type Props = {
  resumos: LinhaHistorico[];
};

export function PainelHistorico({ resumos }: Props) {
  const [detalhe, setDetalhe] = useState<LinhaHistorico | null>(null);
  const indiceDetalhe = detalhe
    ? resumos.findIndex((linha) => linha.competencia === detalhe.competencia)
    : -1;
  const anteriorDetalhe = indiceDetalhe > 0 ? resumos[indiceDetalhe - 1] : null;
  const recentes = resumos.slice(-12);
  const ultimo = resumos.at(-1);
  const mediaSobrou =
    resumos.length === 0 ? 0 : resumos.reduce((acc, linha) => acc + linha.sobrou, 0) / resumos.length;
  const maxMovimento = Math.max(...resumos.map((linha) => Math.max(linha.ganhou, linha.gasto)), 1);

  if (resumos.length === 0) {
    return (
      <section className="mt-8 border-t border-line pt-5">
        <p>Ainda não há meses salvos.</p>
        <Link className="mt-3 inline-block text-sm text-accent underline-offset-2 hover:underline" href="/meses">
          Abrir o mês atual
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        <Kpi
          rotulo="Último mês"
          valor={ultimo ? formatarMoeda(ultimo.sobrou) : "—"}
          detalhe={ultimo ? formatarCompetencia(ultimo.competencia) : ""}
          tom={ultimo ? (ultimo.sobrou >= 0 ? "inflow" : "outflow") : undefined}
        />
        <Kpi
          rotulo="Média do que sobrou"
          valor={formatarMoeda(mediaSobrou)}
          detalhe={`${resumos.length} ${resumos.length === 1 ? "mês" : "meses"}`}
          tom={mediaSobrou >= 0 ? "inflow" : "outflow"}
        />
        <Kpi rotulo="Meses no painel" valor={String(resumos.length)} detalhe="salvos no banco" />
      </section>

      <section className="panel panel-accent mt-5 p-5">
        <h2 className="text-lg font-semibold">Comparativo</h2>
        <p className="mt-1 text-sm text-mute">Últimos 12 meses. Clique numa barra para abrir o detalhe.</p>
        <GraficoHistorico linhas={recentes} onSelecionar={setDetalhe} />
      </section>

      <section className="panel mt-5 overflow-x-auto p-5">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Resumo dos meses salvos</caption>
          <thead>
            <tr className="text-mute">
              <th className="pb-2 pr-4 font-medium" scope="col">
                Mês
              </th>
              <th className="pb-2 pr-4 font-medium" scope="col">
                Movimento
              </th>
              <th className="pb-2 pr-4 font-medium" scope="col">
                Ganhou
              </th>
              <th className="pb-2 pr-4 font-medium" scope="col">
                Gastou
              </th>
              <th className="pb-2 pr-4 font-medium" scope="col">
                Sobrou
              </th>
              <th className="pb-2 pr-4 font-medium" scope="col">
                Contas
              </th>
              <th className="pb-2 pr-4 font-medium" scope="col">
                Situação
              </th>
              <th className="pb-2 font-medium" scope="col">
                Detalhe
              </th>
            </tr>
          </thead>
          <tbody>
            {resumos.map((linha) => (
              <tr key={linha.competencia} className="border-t border-line hover:bg-sheet">
                <th className="py-2.5 pr-4 font-medium" scope="row">
                  <Link className="hover:text-accent hover:underline" href={`/meses/${linha.competencia}`}>
                    {formatarCompetencia(linha.competencia)}
                  </Link>
                </th>
                <td className="py-2.5 pr-4" aria-hidden="true">
                  <div className="flex h-1.5 w-36 overflow-hidden bg-line/70">
                    <span
                      className="block h-1.5 bg-inflow"
                      style={{ width: `${(linha.ganhou / maxMovimento) * 100}%` }}
                    />
                    <span
                      className="block h-1.5 bg-outflow"
                      style={{ width: `${(linha.gasto / maxMovimento) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="money py-2.5 pr-4">{formatarMoeda(linha.ganhou)}</td>
                <td className="money py-2.5 pr-4">{formatarMoeda(linha.gasto)}</td>
                <td className={`money py-2.5 pr-4 ${linha.sobrou >= 0 ? "text-inflow" : "text-outflow"}`}>
                  {formatarMoeda(linha.sobrou)}
                </td>
                <td className="py-2.5 pr-4">
                  <SeloContas pagas={linha.contasPagas} total={linha.contasTotal} />
                </td>
                <td className="py-2.5 pr-4">
                  {linha.fechado ? (
                    <span className="selo-fechado">fechado</span>
                  ) : (
                    <span className="selo-rascunho">rascunho</span>
                  )}
                </td>
                <td className="py-2.5">
                  <button className="text-xs text-accent hover:underline" type="button" onClick={() => setDetalhe(linha)}>
                    Ver números
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal
        aberto={Boolean(detalhe)}
        titulo={detalhe ? formatarCompetencia(detalhe.competencia) : "Mês"}
        descricao={detalhe?.fechado ? "Mês fechado. Os números não mudam até reabrir." : "Ainda é rascunho. Pode editar no painel do mês."}
        onClose={() => setDetalhe(null)}
      >
        {detalhe ? (
          <div>
            <p className="mb-3 flex flex-wrap items-center gap-2">
              <SeloContas pagas={detalhe.contasPagas} total={detalhe.contasTotal} />
              {detalhe.fechado ? (
                <span className="selo-fechado">fechado</span>
              ) : (
                <span className="selo-rascunho">rascunho</span>
              )}
            </p>
            {anteriorDetalhe ? (
              <p
                className={`mb-3 text-sm ${
                  Math.abs(detalhe.sobrou - anteriorDetalhe.sobrou) < 0.005
                    ? "text-mute"
                    : detalhe.sobrou - anteriorDetalhe.sobrou > 0
                      ? "text-inflow"
                      : "text-outflow"
                }`}
              >
                {formatarDeltaMes(
                  detalhe.sobrou,
                  anteriorDetalhe.sobrou,
                  formatarNomeMes(anteriorDetalhe.competencia),
                )}
              </p>
            ) : null}
            <dl className="grid gap-3 text-sm">
              <ItemDetalhe rotulo="Ganhou" valor={detalhe.ganhou} tom="inflow" />
              <ItemDetalhe rotulo="Gastou" valor={detalhe.gasto} tom="outflow" />
              <ItemDetalhe rotulo="Sobrou" valor={detalhe.sobrou} tom={detalhe.sobrou >= 0 ? "inflow" : "outflow"} />
              {detalhe.gastoMensal !== undefined ? (
                <ItemDetalhe rotulo="Gasto mensal" valor={detalhe.gastoMensal} />
              ) : null}
              {detalhe.investido !== undefined ? (
                <ItemDetalhe rotulo="Investido" valor={detalhe.investido} />
              ) : null}
              {detalhe.meta !== undefined ? <ItemDetalhe rotulo="Meta, 10%" valor={detalhe.meta} /> : null}
            </dl>
            <Link
              className="btn-primary mt-5 inline-block"
              href={`/meses/${detalhe.competencia}`}
              onClick={() => setDetalhe(null)}
            >
              Abrir este mês
            </Link>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function Kpi({
  rotulo,
  valor,
  detalhe,
  tom,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  tom?: "inflow" | "outflow";
}) {
  return (
    <div className="border-t border-line pt-3">
      <p className="text-sm text-mute">{rotulo}</p>
      <p
        className={`amount mt-1 text-[1.65rem] ${
          tom === "inflow" ? "text-inflow" : tom === "outflow" ? "text-outflow" : ""
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-xs text-mute">{detalhe}</p>
    </div>
  );
}

function ItemDetalhe({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: number;
  tom?: "inflow" | "outflow";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
      <dt className="text-mute">{rotulo}</dt>
      <dd className={`money font-medium ${tom === "inflow" ? "text-inflow" : tom === "outflow" ? "text-outflow" : ""}`}>
        {formatarMoeda(valor)}
      </dd>
    </div>
  );
}
