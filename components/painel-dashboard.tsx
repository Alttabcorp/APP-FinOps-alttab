"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CampoMes } from "@/components/campo-mes";
import { ModalFecharMes } from "@/components/modal-fechar-mes";
import { NotaMes } from "@/components/nota-mes";
import { RoteiroTransferencia } from "@/components/roteiro-transferencia";
import { useMesEditavel } from "@/components/use-mes-editavel";
import { type DashboardDados } from "@/lib/application/dashboard-visao";
import { progressoPagamento } from "@/lib/application/checklist";
import { parcelaAnualNaCompetencia } from "@/lib/domain/financeiro/anual";
import { competenciaAtual, formatarCompetencia, formatarNomeMes } from "@/lib/domain/financeiro/competencia";
import { montarRoteiroTransferencia } from "@/lib/domain/financeiro/transferencia";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  dados: DashboardDados;
};

export function PainelDashboard({ dados }: Props) {
  const [fecho, setFecho] = useState<"fechar" | "reabrir" | null>(null);
  const router = useRouter();
  const { dto } = dados;
  const {
    mes,
    totais,
    somenteLeitura,
    status,
    pendente,
    sujo,
    salvar,
    marcarPago,
    atualizarItem,
    adicionarExtraMes,
    adicionarSaldo,
    agendarSalvar,
    definirFechado,
    trazerEntradasAnteriores,
  } = useMesEditavel({
    mesInicial: dto,
    faturaCartao: dados.faturaCartao,
    gastoPessoalMes: dados.gastoPessoalMes,
    reposicaoMeta: dados.reposicaoMeta,
    cartaoFixo: dados.cartaoFixo,
  });
  const pagamento = progressoPagamento(mes.itens);
  const anterior = dados.resumoAnterior;
  const roteiro = montarRoteiroTransferencia(totais, {
    contas: dados.contas,
    anuais: dados.anuais
      .map((conta) => {
        const parcela = parcelaAnualNaCompetencia(conta, mes.competencia);
        if (!parcela) return null;
        return {
          id: conta.id,
          nome: conta.nome,
          valor: parcela.valor,
          banco: conta.banco,
          chavePix: conta.chavePix,
        };
      })
      .filter((conta): conta is NonNullable<typeof conta> => conta != null),
    destinoCartao:
      dados.destinoCartaoNome || dados.destinoCartaoChave
        ? { nome: dados.destinoCartaoNome, chavePix: dados.destinoCartaoChave }
        : null,
  });
  const semEntrada = totais.resumo.ganhou < 0.005;
  const podePrever =
    !somenteLeitura && semEntrada && anterior != null && anterior.ganhou > 0.005;

  const irPara = (proxima: string) => {
    if (sujo && !mes.fechado) salvar();
    router.push(proxima === competenciaAtual() ? "/" : `/?mes=${proxima}`);
  };

  return (
    <article className="mx-auto max-w-[78rem] px-4 py-6 pb-16 lg:px-8 lg:py-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">{formatarCompetencia(mes.competencia)}</h1>
          <p className="mt-1 text-sm text-mute">
            {somenteLeitura
              ? "Mês fechado. Os números não mudam até reabrir."
              : "Entradas, contas e cartão. O resto fica em Investimentos."}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <CampoMes id="mes-inicio" label="Mês" value={mes.competencia} onChange={irPara} />
          <button
            className="btn"
            type="button"
            onClick={() => setFecho(somenteLeitura ? "reabrir" : "fechar")}
          >
            {somenteLeitura ? "Reabrir" : "Fechar o mês"}
          </button>
        </div>
      </header>

      <dl className="rito-faixa mt-6">
        <div>
          <dt>Entrou</dt>
          <dd className="amount text-inflow">{formatarMoeda(totais.resumo.ganhou)}</dd>
        </div>
        <div>
          <dt>Saiu</dt>
          <dd className="amount text-outflow">{formatarMoeda(totais.resumo.gasto)}</dd>
        </div>
        <div>
          <dt>
            <Link className="hover:underline" href="/investimentos#rito-meta">
              Para a meta
            </Link>
          </dt>
          <dd className={`amount ${totais.distribuicao.metaFinal > 0.005 ? "text-inflow" : "text-mute"}`}>
            {formatarMoeda(totais.distribuicao.metaFinal)}
          </dd>
        </div>
      </dl>

      {totais.rendimento.apertado ? (
        <p className="rito-aperto mt-3">Mês apertado: rendimento foi para as contas. Sem aporte se não der.</p>
      ) : null}

      <RoteiroTransferencia linhas={roteiro} />

      {podePrever ? (
        <p className="mt-4 text-sm">
          <button className="btn text-sm" type="button" disabled={pendente} onClick={trazerEntradasAnteriores}>
            {pendente
              ? "Trazendo…"
              : `Usar entradas de ${formatarNomeMes(anterior.competencia)}`}
          </button>
          <span className="mt-2 block text-mute">
            Entra como previsão. Ajustem quando o dinheiro chegar.
          </span>
        </p>
      ) : null}

      <p className="mt-4 text-sm text-mute">
        Poupança, fundo imobiliário, meta e Alttab ficam em{" "}
        <Link className="underline" href="/investimentos">
          Investimentos
        </Link>
        . Gráficos e comparativo dos meses ficam em{" "}
        <Link className="underline" href="/acompanhar">
          Acompanhar
        </Link>
        .
      </p>

      <div className="inicio-nota mt-6">
        <NotaMes
          mes={mes}
          faturaCartao={dados.faturaCartao}
          parcelasCartao={dados.parcelasCartao}
          recorrentesCartao={dados.recorrentesCartao}
          totais={totais}
          superficie="inicio"
          onToggle={marcarPago}
          onSalvarConta={(indice, valor, pago) => atualizarItem(indice, { valor, pago })}
          onSalvarItem={(indice, valor) => atualizarItem(indice, { valor })}
          onSalvarCampo={(campo, valor) =>
            agendarSalvar(
              campo === "poupancaReal"
                ? { ...mes, poupancaReal: valor, poupancaEditado: true }
                : { ...mes, [campo]: valor },
            )
          }
          onNovaConta={adicionarExtraMes}
          onNovoBico={adicionarSaldo}
          somenteLeitura={somenteLeitura}
        />
        <p className="sr-only" aria-live="polite">
          {status}
        </p>
      </div>

      <ModalFecharMes
        aberto={fecho !== null}
        modo={fecho ?? "fechar"}
        contasAbertas={pagamento.total - pagamento.pagas}
        pendente={pendente}
        onClose={() => setFecho(null)}
        onConfirmar={() => {
          definirFechado(fecho === "reabrir" ? false : true);
          setFecho(null);
        }}
      />
    </article>
  );
}
