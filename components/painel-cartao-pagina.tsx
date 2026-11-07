"use client";

import { BotaoFlutuante } from "@/components/botao-flutuante";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adicionarLancamentoAction, removerLancamentoAction, salvarDiaFechamentoAction } from "@/app/actions/lancamento";
import { marcarDepositoAction } from "@/app/actions/mes";
import { CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { CampoPassos } from "@/components/campo-passos";
import { Modal } from "@/components/modal";
import { PainelCartao } from "@/components/painel-cartao";
import type { CompraCartaoDTO, RecorrenteCartaoDTO } from "@/lib/application/cartao-mapper";
import type { LancamentoDTO } from "@/lib/application/lancamento-service";
import type { MesDTO } from "@/lib/application/mes-mapper";
import { parcelasDoMes, somarRecorrentes } from "@/lib/domain/financeiro/cartao";
import { avancarCompetencia, formatarCompetencia, formatarNomeMes } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  competencia: string;
  mes: MesDTO;
  teto: number;
  compras: CompraCartaoDTO[];
  recorrentes: RecorrenteCartaoDTO[];
  lancamentos: LancamentoDTO[];
  faturaHoje: string;
  diaFechamento: number;
};

type Cadastro = "compra" | "fixo" | "tudo" | null;

const formatarDia = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));

export function PainelCartaoPagina({
  competencia,
  mes,
  teto,
  compras,
  recorrentes,
  lancamentos,
  faturaHoje,
  diaFechamento,
}: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [cadastro, setCadastro] = useState<Cadastro>(null);
  const [avulsoAberto, setAvulsoAberto] = useState(false);
  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [fechamento, setFechamento] = useState(diaFechamento);
  const [erro, setErro] = useState("");
  const [status, setStatus] = useState("");

  const fechado = mes.fechado;
  const parcelas = parcelasDoMes(compras, competencia);
  const totalParcelas = parcelas.reduce((acc, parcela) => acc + parcela.valor, 0);
  const totalFixos = somarRecorrentes(recorrentes);
  const fatura = totalParcelas + totalFixos + mes.cartaoReal;
  const estoura = teto > 0 ? fatura > teto + 0.005 : fatura > 0.005;
  const percentual = teto > 0 ? Math.min(100, (fatura / teto) * 100) : fatura > 0 ? 100 : 0;
  const pago = Boolean(mes.depositos?.cartao);

  const somar = () => {
    setErro("");
    startTransition(async () => {
      const resposta = await adicionarLancamentoAction({ competencia, categoria: "cartao", valor, descricao });
      if (resposta.ok) {
        setStatus(`${formatarMoeda(valor)} somados na fatura de ${formatarNomeMes(resposta.competencia ?? competencia)}.`);
        setValor(0);
        setDescricao("");
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const remover = (id: string) => {
    startTransition(async () => {
      const resposta = await removerLancamentoAction(id);
      if (resposta.ok) router.refresh();
      else setErro(resposta.erro);
    });
  };

  const mudarFechamento = (dia: number) => {
    setFechamento(dia);
    startTransition(async () => {
      const resposta = await salvarDiaFechamentoAction(dia);
      if (resposta.ok) {
        setStatus(`Fatura fecha no dia ${dia}.`);
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const marcarPago = (marcado: boolean) => {
    startTransition(async () => {
      const resposta = await marcarDepositoAction(competencia, "cartao", marcado);
      if (resposta.ok) router.refresh();
      else setErro(resposta.erro);
    });
  };

  const caixa = (titulo: string, nota: string, total: number, acao: React.ReactNode, corpo: React.ReactNode) => (
    <section className="caixa" aria-label={titulo}>
      <header className="caixa-topo">
        <div className="min-w-0 flex-1">
          <h2 className="caixa-titulo">{titulo}</h2>
          <p className="caixa-funcao">{nota}</p>
        </div>
        <p className="money shrink-0 text-lg font-semibold text-outflow">{formatarMoeda(total)}</p>
      </header>
      <div className="caixa-corpo">
        {corpo}
        {acao}
      </div>
    </section>
  );

  const linhaSimples = (chave: string, nome: string, detalhe: string | null, total: number) => (
    <li key={chave} className="ganho-linha">
      <span className="min-w-0 flex-1">
        <span className="block truncate">{nome}</span>
        {detalhe ? <span className="block text-xs text-mute">{detalhe}</span> : null}
      </span>
      <span className="money shrink-0 text-sm">{formatarMoeda(total)}</span>
    </li>
  );

  return (
    <article className="mx-auto max-w-[72rem] px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Cartão de {formatarCompetencia(competencia)}</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-mute">
            {fechado
              ? "Mês fechado (somente leitura)."
              : `A fatura fecha no dia ${diaFechamento}: compras depois disso entram na fatura seguinte.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn" href={`/cartao?mes=${avancarCompetencia(competencia, -1)}`} aria-label="Mês anterior">
            ‹
          </Link>
          <Link className="btn" href={`/cartao?mes=${avancarCompetencia(competencia, 1)}`} aria-label="Próximo mês">
            ›
          </Link>
          {fechado ? null : (
            <button type="button" className="btn-primary novo-topo" onClick={() => setCadastro("compra")}>
              Nova compra
            </button>
          )}
          <Link className="btn" href={`/?mes=${competencia}`}>
            Voltar ao início
          </Link>
        </div>
      </header>

      <section className="resumo-faixa mt-5" aria-label="Resumo do cartão">
        <div className="resumo-celula is-principal">
          <p className="kpi-rotulo">Fatura do mês</p>
          <p className={`amount resumo-valor ${estoura ? "text-outflow" : ""}`}>{formatarMoeda(fatura)}</p>
          <p className="text-xs text-mute">Fixos + parcelas + avulso</p>
        </div>
        <div className="resumo-celula">
          <p className="kpi-rotulo">Teto do cartão</p>
          <p className="money resumo-valor-sm">{formatarMoeda(teto)}</p>
        </div>
        <div className="resumo-celula">
          <p className="kpi-rotulo">{estoura ? "Passou do teto" : "Ainda cabe"}</p>
          <p className={`money resumo-valor-sm ${estoura ? "text-outflow" : "text-inflow"}`}>
            {formatarMoeda(Math.abs(teto - fatura))}
          </p>
        </div>
      </section>

      <div className={`cartao-barra mt-3 ${estoura ? "is-estoura" : ""}`} role="progressbar" aria-label="Fatura em relação ao teto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentual)}>
        <div style={{ width: `${percentual}%` }} />
      </div>

      {erro && !avulsoAberto ? (
        <p className="mt-4 text-sm text-outflow" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="caixas-grade">
        {caixa(
          "Gastos fixos",
          "Academia, assinaturas… entram toda fatura.",
          totalFixos,
          fechado ? null : (
            <button type="button" className="btn text-sm self-start" onClick={() => setCadastro("fixo")}>
              Novo gasto fixo
            </button>
          ),
          recorrentes.length === 0 ? (
            <p className="text-sm text-mute">Nenhum gasto fixo no cartão.</p>
          ) : (
            <ul>{recorrentes.map((fixo) => linhaSimples(fixo.id, fixo.nome, null, fixo.valor))}</ul>
          ),
        )}
        {caixa(
          "Parcelas do mês",
          "Compras parceladas que caem nesta fatura.",
          totalParcelas,
          fechado ? null : (
            <button type="button" className="btn text-sm self-start" onClick={() => setCadastro("tudo")}>
              Editar compras e fixos
            </button>
          ),
          parcelas.length === 0 ? (
            <p className="text-sm text-mute">Nenhuma parcela neste mês.</p>
          ) : (
            <ul>
              {parcelas.map((parcela) =>
                linhaSimples(`${parcela.nome}-${parcela.atual}`, parcela.nome, `Parcela ${parcela.atual}/${parcela.total}`, parcela.valor),
              )}
            </ul>
          ),
        )}
        {caixa(
          "Avulso na fatura",
          "Compras do dia a dia no cartão. Some cada uma ao total.",
          mes.cartaoReal,
          fechado ? null : (
            <button
              type="button"
              className="btn text-sm self-start"
              onClick={() => {
                setErro("");
                setAvulsoAberto(true);
              }}
            >
              + Adicionar compra
            </button>
          ),
          lancamentos.length === 0 ? (
            <p className="text-sm text-mute">Nenhum lançamento avulso nesta fatura.</p>
          ) : (
            <ul>
              {lancamentos.map((item) => (
                <li key={item.id} className="ganho-linha">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.descricao || "Compra"}</span>
                    <span className="block text-xs text-mute">{formatarDia(item.data)}</span>
                  </span>
                  <span className="money shrink-0 text-sm">{formatarMoeda(item.valor)}</span>
                  {fechado ? null : (
                    <button type="button" className="btn text-xs" disabled={pendente} onClick={() => remover(item.id)}>
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ),
        )}
        <section className="caixa" aria-label="Pagamento da fatura">
          <header className="caixa-topo">
            <div className="min-w-0 flex-1">
              <h2 className="caixa-titulo">Pagamento</h2>
              <p className="caixa-funcao">Marque quando a fatura for paga.</p>
            </div>
          </header>
          <div className="caixa-corpo">
            <label className="cartao-pago">
              <input
                className="checkbox-pago"
                type="checkbox"
                checked={pago}
                disabled={fechado || pendente}
                onChange={(evento) => marcarPago(evento.target.checked)}
              />
              <span>Fatura paga</span>
            </label>
            <CampoPassos
              id="cartao-fechamento-pagina"
              label="A fatura fecha no dia"
              value={fechamento}
              min={1}
              max={28}
              onChange={mudarFechamento}
            />
          </div>
        </section>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {fechado ? null : <BotaoFlutuante rotulo="Nova compra" onClick={() => setCadastro("compra")} />}

      <Modal
        aberto={avulsoAberto}
        titulo="Compra avulsa no cartão"
        descricao="Some cada compra ao total da fatura."
        onClose={() => setAvulsoAberto(false)}
      >
        <form
          className="grid gap-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            somar();
          }}
        >
          <p className="text-sm text-mute">
            {faturaHoje === competencia
              ? `A compra de hoje entra na fatura de ${formatarNomeMes(faturaHoje)}.`
              : `Pela data de hoje, a compra entra na fatura de ${formatarNomeMes(faturaHoje)}.`}
          </p>
          <CampoMoeda id="cartao-valor" label="Valor da compra" value={valor} onChange={setValor} autoFocus />
          <CampoTexto id="cartao-desc" label="Onde (opcional)" value={descricao} placeholder="Ex.: Mercado Livre" onChange={setDescricao} />
          {erro ? (
            <p className="text-sm text-outflow" role="alert">
              {erro}
            </p>
          ) : null}
          <button type="submit" className="btn-primary" disabled={pendente}>
            {pendente ? "Salvando…" : "Somar à fatura"}
          </button>
        </form>
      </Modal>

      {cadastro ? (
        <Modal
          aberto
          titulo="Compras e fixos do cartão"
          descricao="Cadastre, edite ou remova compras parceladas e gastos fixos."
          onClose={() => setCadastro(null)}
          largura="lg"
        >
          <PainelCartao
            key={cadastro}
            compras={compras}
            recorrentes={recorrentes}
            teto={teto}
            competenciaInicioPadrao={faturaHoje}
            abrirNovo={cadastro === "compra"}
            abrirFixo={cadastro === "fixo"}
            embutido
          />
        </Modal>
      ) : null}
    </article>
  );
}
