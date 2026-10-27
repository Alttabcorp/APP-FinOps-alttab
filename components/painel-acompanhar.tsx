"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChecklistDepositos } from "@/components/checklist-depositos";
import { GraficoHistorico } from "@/components/grafico-historico";
import type { CampoDeposito, LinhaTransferencia } from "@/lib/domain/financeiro/transferencia";
import {
  compararComAnterior,
  mesDoMaior,
  somaNoPeriodo,
  type ChaveAcompanhar,
  type LinhaAcompanhar,
} from "@/lib/domain/financeiro/acompanhar";
import {
  competenciaAtual,
  formatarCompetencia,
  formatarCompetenciaCurta,
  formatarNomeMes,
} from "@/lib/domain/financeiro/competencia";
import { formatarDeltaMes, formatarMoeda } from "@/lib/formatacao";

type Props = {
  linhas: LinhaAcompanhar[];
  estoque: {
    poupanca: number;
    investimento: number;
    meta: number;
  };
  mesAtual: {
    competencia: string;
    fechado: boolean;
    marcas: Record<CampoDeposito, boolean>;
  } | null;
  depositos: LinhaTransferencia[];
};

const GASTOS: { chave: ChaveAcompanhar; rotulo: string; tom: "inflow" | "outflow" | "ink" }[] = [
  { chave: "salario", rotulo: "Salário", tom: "inflow" },
  { chave: "gasto", rotulo: "Gastou", tom: "outflow" },
  { chave: "cartao", rotulo: "Cartão", tom: "outflow" },
  { chave: "agua", rotulo: "Água", tom: "outflow" },
  { chave: "energia", rotulo: "Energia", tom: "outflow" },
];

const APORTES: { chave: ChaveAcompanhar; rotulo: string; tom: "inflow" | "outflow" | "ink" }[] = [
  { chave: "poupanca", rotulo: "Poupança", tom: "ink" },
  { chave: "fundo", rotulo: "Fundo", tom: "ink" },
  { chave: "alttab", rotulo: "Alttab", tom: "ink" },
  { chave: "paraMeta", rotulo: "Para a meta", tom: "inflow" },
];

export function PainelAcompanhar({ linhas, estoque, mesAtual, depositos }: Props) {
  const router = useRouter();
  const atual = competenciaAtual();
  const visiveis = linhas.filter((linha) => linha.competencia <= atual);
  const recentes = visiveis.slice(-12);
  if (visiveis.length === 0) {
    return (
      <p className="mt-8 text-sm text-mute">
        Ainda não há meses para comparar. O mês se lança no{" "}
        <Link className="underline" href="/">
          Início
        </Link>
        .
      </p>
    );
  }

  const achados = montarFrases(visiveis);
  const aportesPoupanca = somaNoPeriodo(visiveis, "poupanca");
  const aportesFundo = somaNoPeriodo(visiveis, "fundo");
  const historico = recentes.map((linha) => ({
    competencia: linha.competencia,
    ganhou: linha.ganhou,
    gasto: linha.gasto,
    sobrou: linha.sobrou,
    investido: linha.investido,
    meta: linha.paraMeta,
    fechado: linha.fechado,
  }));

  return (
    <div className="acompanhar">
      {mesAtual ? (
        <ChecklistDepositos
          competencia={mesAtual.competencia}
          fechado={mesAtual.fechado}
          linhas={depositos}
          marcas={mesAtual.marcas}
        />
      ) : null}

      <section className="mt-10" aria-labelledby="acompanhar-hoje">
        <h2 id="acompanhar-hoje" className="titulo-secao">
          Saldo agora
        </h2>
        <dl className="rito-faixa mt-4">
          <div>
            <dt>Poupança</dt>
            <dd className="amount">{formatarMoeda(estoque.poupanca)}</dd>
          </div>
          <div>
            <dt>Investimento</dt>
            <dd className="amount">{formatarMoeda(estoque.investimento)}</dd>
          </div>
          <div>
            <dt>Meta</dt>
            <dd className="amount">{formatarMoeda(estoque.meta)}</dd>
          </div>
        </dl>
        {aportesPoupanca > 0.005 || aportesFundo > 0.005 ? (
          <p className="mt-3 max-w-[46ch] text-sm text-mute">
            Aportes no período: poupança {formatarMoeda(aportesPoupanca)}, fundo {formatarMoeda(aportesFundo)}.
          </p>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="acompanhar-comparativo">
        <h2 id="acompanhar-comparativo" className="titulo-secao">
          Comparativo dos meses
        </h2>
        <p className="mt-1 text-sm text-mute">Ganhou, gastou e o que sobrou. Clique numa barra para abrir o mês.</p>
        <GraficoHistorico
          linhas={historico}
          onSelecionar={(linha) => {
            router.push(linha.competencia === atual ? "/" : `/?mes=${linha.competencia}`);
          }}
        />
      </section>

      {achados.length > 0 ? (
        <section className="mt-10" aria-labelledby="acompanhar-achados">
          <h2 id="acompanhar-achados" className="titulo-secao">
            O que mudou
          </h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {achados.map((frase) => (
              <li key={frase} className="border-t border-line pt-2 text-ink">
                {frase}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-8 text-sm text-mute">Falta outro mês para comparar salário, cartão, água e energia.</p>
      )}

      <div className="acompanhar-grupos mt-10">
        <section aria-labelledby="acompanhar-gastos">
          <h2 id="acompanhar-gastos" className="titulo-secao">
            Gastos
          </h2>
          <p className="mt-1 text-sm text-mute">Cada traço é um mês.</p>
          <ul className="mt-5 grid gap-5">
            {GASTOS.map((serie) => (
              <li key={serie.chave}>
                <FaixaSerie linhas={recentes} chave={serie.chave} rotulo={serie.rotulo} tom={serie.tom} />
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="acompanhar-aportes">
          <h2 id="acompanhar-aportes" className="titulo-secao">
            Aportes
          </h2>
          <p className="mt-1 text-sm text-mute">O que entrou naquele mês, não o estoque.</p>
          <ul className="mt-5 grid gap-5">
            {APORTES.map((serie) => (
              <li key={serie.chave}>
                <FaixaSerie linhas={recentes} chave={serie.chave} rotulo={serie.rotulo} tom={serie.tom} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10 overflow-x-auto border-t border-line pt-5">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Comparativo dos meses</caption>
          <thead>
            <tr className="text-mute">
              <th className="pb-2 pr-3 font-medium" scope="col">
                Mês
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Salário
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Gastou
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Sobrou
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Cartão
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Água
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Energia
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Poupança
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Fundo
              </th>
              <th className="pb-2 pr-3 font-medium" scope="col">
                Alttab
              </th>
              <th className="pb-2 font-medium" scope="col">
                Meta
              </th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((linha) => {
              const href =
                linha.competencia === competenciaAtual() ? "/" : `/?mes=${linha.competencia}`;
              return (
                <tr key={linha.competencia} className="border-t border-line">
                  <th className="py-2 pr-3 font-medium" scope="row">
                    <Link className="hover:underline" href={href}>
                      {formatarCompetenciaCurta(linha.competencia)}
                    </Link>
                    {linha.fechado ? (
                      <span className="ml-2 text-xs font-normal text-mute">fechado</span>
                    ) : null}
                  </th>
                  <td className="money py-2 pr-3">{formatarMoeda(linha.salario)}</td>
                  <td className="money py-2 pr-3">{formatarMoeda(linha.gasto)}</td>
                  <td className={`money py-2 pr-3 ${linha.sobrou >= 0 ? "text-inflow" : "text-outflow"}`}>
                    {formatarMoeda(linha.sobrou)}
                  </td>
                  <td className="money py-2 pr-3">{formatarMoeda(linha.cartao)}</td>
                  <td className="money py-2 pr-3">{formatarMoeda(linha.agua)}</td>
                  <td className="money py-2 pr-3">{formatarMoeda(linha.energia)}</td>
                  <td className="money py-2 pr-3">{formatarMoeda(linha.poupanca)}</td>
                  <td className="money py-2 pr-3">{formatarMoeda(linha.fundo)}</td>
                  <td className="money py-2 pr-3">{formatarMoeda(linha.alttab)}</td>
                  <td className="money py-2">{formatarMoeda(linha.paraMeta)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function FaixaSerie({
  linhas,
  chave,
  rotulo,
  tom,
}: {
  linhas: LinhaAcompanhar[];
  chave: ChaveAcompanhar;
  rotulo: string;
  tom: "inflow" | "outflow" | "ink";
}) {
  const pico = mesDoMaior(linhas, chave);
  const ultimo = linhas.at(-1);
  const comparativo = compararComAnterior(linhas, chave);
  const maximo = Math.max(...linhas.map((linha) => linha[chave]), 1);

  return (
    <div className="acompanhar-faixa">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-medium">{rotulo}</p>
        <p className="money text-sm">
          {ultimo ? formatarMoeda(ultimo[chave]) : "—"}
          {comparativo && comparativo.anterior.valor >= 0.005 ? (
            <span
              className={`ml-2 text-xs ${
                Math.abs(comparativo.delta) < 0.005
                  ? "text-mute"
                  : comparativo.delta > 0
                    ? tom === "outflow"
                      ? "text-outflow"
                      : "text-inflow"
                    : tom === "outflow"
                      ? "text-inflow"
                      : "text-outflow"
              }`}
            >
              {formatarDeltaMes(
                comparativo.atual.valor,
                comparativo.anterior.valor,
                formatarNomeMes(comparativo.anterior.competencia),
              )}
            </span>
          ) : null}
        </p>
      </div>
      <ol className="acompanhar-tracos" aria-label={`${rotulo} nos últimos meses`}>
        {linhas.map((linha) => {
          const valor = linha[chave];
          const altura = Math.max(4, (valor / maximo) * 100);
          const recorde = pico?.competencia === linha.competencia;
          return (
            <li key={linha.competencia}>
              <Link
                href={linha.competencia === competenciaAtual() ? "/" : `/?mes=${linha.competencia}`}
                className="acompanhar-traco"
                title={`${formatarCompetencia(linha.competencia)} · ${formatarMoeda(valor)}`}
              >
                <span
                  className={`acompanhar-coluna ${recorde ? "is-pico" : ""} is-${tom}`}
                  style={{ height: `${altura}%` }}
                />
                <span className="acompanhar-mes">{formatarCompetenciaCurta(linha.competencia)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function montarFrases(linhas: LinhaAcompanhar[]) {
  const frases: string[] = [];
  const gasto = mesDoMaior(linhas, "gasto");
  if (gasto) {
    frases.push(`O mês que mais saiu dinheiro foi ${formatarCompetencia(gasto.competencia)}: ${formatarMoeda(gasto.valor)}.`);
  }
  const cartao = mesDoMaior(linhas, "cartao");
  if (cartao) {
    frases.push(`O cartão mais alto foi ${formatarCompetencia(cartao.competencia)}: ${formatarMoeda(cartao.valor)}.`);
  }
  const agua = mesDoMaior(linhas, "agua");
  if (agua) {
    frases.push(`Água mais alta em ${formatarCompetencia(agua.competencia)}: ${formatarMoeda(agua.valor)}.`);
  }
  const energia = mesDoMaior(linhas, "energia");
  if (energia) {
    frases.push(`Energia mais alta em ${formatarCompetencia(energia.competencia)}: ${formatarMoeda(energia.valor)}.`);
  }
  const salario = compararComAnterior(linhas, "salario");
  if (salario && salario.anterior.valor >= 0.005) {
    if (Math.abs(salario.delta) < 0.005) {
      frases.push(`O salário ficou igual ao de ${formatarNomeMes(salario.anterior.competencia)}.`);
    } else if (salario.delta > 0) {
      frases.push(
        `O salário subiu ${formatarMoeda(salario.delta)} em relação a ${formatarNomeMes(salario.anterior.competencia)}.`,
      );
    } else {
      frases.push(
        `O salário caiu ${formatarMoeda(Math.abs(salario.delta))} em relação a ${formatarNomeMes(salario.anterior.competencia)}.`,
      );
    }
  }
  return frases;
}
