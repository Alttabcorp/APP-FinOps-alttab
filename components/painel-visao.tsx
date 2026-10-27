"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CampoMes } from "@/components/campo-mes";
import { GraficoHistorico } from "@/components/grafico-historico";
import { montarAtencao, type DashboardDados } from "@/lib/application/dashboard-visao";
import { progressoPagamento } from "@/lib/application/checklist";
import {
  competenciaAtual,
  formatarCompetencia,
  formatarNomeMes,
} from "@/lib/domain/financeiro/competencia";
import { formatarDeltaMes, formatarMoeda } from "@/lib/formatacao";

type Props = {
  dados: DashboardDados;
};

export function PainelVisao({ dados }: Props) {
  const router = useRouter();
  const { dto, resultado, resumoAnterior, competencia } = dados;
  const pagamento = progressoPagamento(dto.itens);
  const recentes = dados.resumos.slice(-4).reverse();
  const deltaSobrou = resumoAnterior ? resultado.resumo.sobrou - resumoAnterior.sobrou : 0;
  const atencao = montarAtencao({
    competencia: dto.competencia,
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
      href: "/#rito-entrou",
      rotulo: "Ganhou",
      valor: formatarMoeda(resultado.resumo.ganhou),
      tom: "inflow" as const,
    },
    {
      href: "/#rito-contas",
      rotulo: "Gastou",
      valor: formatarMoeda(resultado.resumo.gasto),
      tom: "outflow" as const,
    },
    {
      href: "/#rito-contas",
      rotulo: "A pagar",
      valor: pagamento.total === 0 ? "—" : formatarMoeda(pagamento.aberto),
      detalhe: pagamento.total === 0 ? "Nada neste mês" : `${pagamento.pagas} de ${pagamento.total} pagas`,
    },
    {
      href: "/cartao",
      rotulo: "Fatura",
      valor: formatarMoeda(
        dados.resultado.despesasVariaveis.cartao.fixo + dados.resultado.despesasVariaveis.cartao.parcelas,
      ),
    },
  ];

  const bolsos = [
    {
      href: "/investimentos",
      rotulo: "Meta",
      valor: dados.totais.meta,
      detalhe: dados.abertoMeta > 0.005 ? `Deve ${formatarMoeda(dados.abertoMeta)}` : undefined,
    },
    { href: "/contas", rotulo: "Reserva", valor: dados.totais.reserva },
    { href: "/investimentos", rotulo: "Poupança", valor: dados.totais.poupanca },
    { href: "/investimentos", rotulo: "Investimento", valor: dados.totais.investimento },
    { href: "/empresa", rotulo: "Empresa", valor: dados.totais.empresa },
  ];

  const irPara = (proxima: string) => {
    router.push(proxima === competenciaAtual() ? "/dashboard" : `/dashboard?mes=${proxima}`);
  };

  return (
    <article className="mx-auto max-w-[76rem] px-4 py-6 pb-16 lg:px-8 lg:py-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Números</h1>
          <p className="mt-1 text-sm text-mute">
            {formatarCompetencia(dto.competencia)}
            {dto.fechado ? " · mês fechado" : null}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <CampoMes id="mes-dashboard" label="Mês" value={competencia} onChange={irPara} />
          <Link className="btn text-sm" href="/acompanhar">
            Acompanhar meses
          </Link>
        </div>
      </header>

      <div className="dash mt-6">
        <div className="dash-topo">
          <Link href={dto.competencia === competenciaAtual() ? "/" : `/?mes=${dto.competencia}`} className="kpi is-principal">
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

        {dados.resumos.length > 0 ? (
          <section>
            <header className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="titulo-secao">Comparativo dos meses</h2>
              <Link className="text-sm underline" href="/acompanhar">
                Acompanhar
              </Link>
            </header>
            <GraficoHistorico
              linhas={dados.resumos.slice(-12)}
              compacto
              onSelecionar={(linha) => {
                router.push(linha.competencia === competenciaAtual() ? "/" : `/?mes=${linha.competencia}`);
              }}
            />
            <ul className="dash-meses mt-4">
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
    </article>
  );
}
