"use client";

import { AbasSecao } from "@/components/abas-secao";
import { BotaoFlutuante } from "@/components/botao-flutuante";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { adicionarLancamentoAction, removerLancamentoAction, salvarDiaFechamentoAction } from "@/app/actions/lancamento";
import { marcarDepositoAction, salvarMesAction } from "@/app/actions/mes";
import { CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { CampoPassos } from "@/components/campo-passos";
import { Modal } from "@/components/modal";
import { ModalNovaConta } from "@/components/nota-mes";
import { PainelCartao } from "@/components/painel-cartao";
import type { ContaAnualDTO } from "@/lib/application/anual-mapper";
import type { CompraCartaoDTO, RecorrenteCartaoDTO } from "@/lib/application/cartao-mapper";
import {
  type LancamentoDTO,
  type CategoriaVariavel,
  type MeioPagamentoVariavel,
  type TemaVariavel,
  descricaoComPrefixo,
  detalheDescricaoLancamento,
  ehLancamentoDoTema,
  meioPagamentoLancamento,
  resumoLancamentosHoje,
  resumoTemaNoMes,
  ROTULOS_MEIO_PAGAMENTO,
  somarLancamentos,
} from "@/lib/application/lancamento-service";
import type { ItemDTO, MesDTO } from "@/lib/application/mes-mapper";
import { avancarCompetencia, formatarCompetencia, formatarNomeMes } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";
import { isAbaGastos, isTemaDia, type AbaGastos, type TemaDia } from "@/lib/ui/abas";

type Props = {
  competencia: string;
  mesInicial: MesDTO;
  ganhou: number;
  gasto: number;
  sobrou: number;
  cartaoParcelas: number;
  /** Compras 1x ainda cadastradas como CompraCartao (somam nos avulsos). */
  cartaoAvulsosCompra?: number;
  cartaoFixo: number;
  sugestoes: { feira: number; gasolina: number };
  aportes: {
    campo: "poupanca" | "reserva" | "fundo" | "alttab" | "meta" | string;
    rotulo: string;
    valor: number;
    sugestao: number;
    somenteLeitura?: boolean;
  }[];
  lancamentos: LancamentoDTO[];
  abrirCategoria?: CategoriaVariavel | null;
  /** Aba inicial (?aba= ou inferida de ?add=). */
  abaInicial?: AbaGastos;
  /** Sub-aba de Dia a dia (?tema=). */
  temaInicial?: TemaDia;
  contasAnuais: ContaAnualDTO[];
  compras: CompraCartaoDTO[];
  recorrentes: RecorrenteCartaoDTO[];
  /** Fatura em que uma compra feita hoje entra (depende do dia de fechamento). */
  faturaHoje: string;
  diaFechamento: number;
  diaPagamento: number;
  tetoCartao: number;
};

const ROTULO_CATEGORIA: Record<CategoriaVariavel, string> = {
  feira: "Feira",
  gasolina: "Gasolina",
  cartao: "Cartão avulso",
};

const formatarDia = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

const soma = (itens: ItemDTO[]) => itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

export function PainelDespesas({
  competencia,
  mesInicial,
  ganhou,
  gasto,
  sobrou,
  cartaoParcelas,
  cartaoAvulsosCompra = 0,
  cartaoFixo,
  sugestoes,
  aportes,
  lancamentos,
  abrirCategoria = null,
  abaInicial = "fixas",
  temaInicial = "feira",
  contasAnuais,
  compras,
  recorrentes,
  faturaHoje,
  diaFechamento,
  diaPagamento,
  tetoCartao,
}: Props) {
  const router = useRouter();
  const [mes, setMes] = useState(mesInicial);
  // Sincroniza com o servidor: ao trocar de mês ou recarregar os dados, descarta o estado local antigo.
  const [mesRecebido, setMesRecebido] = useState(mesInicial);
  if (mesRecebido !== mesInicial) {
    setMesRecebido(mesInicial);
    setMes(mesInicial);
  }
  const [aba, setAba] = useState<AbaGastos>(abaInicial);
  const [temaDia, setTemaDia] = useState<TemaDia>(temaInicial);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [categoria, setCategoria] = useState<CategoriaVariavel | null>(mesInicial.fechado ? null : abrirCategoria);
  const [valorGasto, setValorGasto] = useState(0);
  const [descGasto, setDescGasto] = useState("");
  const [meioPagamento, setMeioPagamento] = useState<MeioPagamentoVariavel>("dinheiro");
  const [erroGasto, setErroGasto] = useState("");
  const [anualId, setAnualId] = useState<string | null>(null);
  const [cartaoAberto, setCartaoAberto] = useState(false);
  const [fechamento, setFechamento] = useState(diaFechamento);
  const [status, setStatus] = useState("");
  const [pendente, startTransition] = useTransition();

  useEffect(() => setMes(mesInicial), [mesInicial]);
  useEffect(() => setAba(abaInicial), [abaInicial]);
  useEffect(() => setTemaDia(temaInicial), [temaInicial]);

  const sincronizarUrl = (proximaAba: AbaGastos, proximoTema: TemaDia) => {
    const params = new URLSearchParams();
    params.set("mes", competencia);
    if (proximaAba !== "fixas") params.set("aba", proximaAba);
    if (proximaAba === "dia" && proximoTema !== "feira") params.set("tema", proximoTema);
    router.replace(`/despesas?${params.toString()}`, { scroll: false });
  };

  const irParaAba = (id: string) => {
    const proxima: AbaGastos = isAbaGastos(id) ? id : "fixas";
    setAba(proxima);
    sincronizarUrl(proxima, temaDia);
  };

  const irParaTemaDia = (id: string) => {
    const proximo: TemaDia = isTemaDia(id) ? id : "feira";
    setTemaDia(proximo);
    setAba("dia");
    sincronizarUrl("dia", proximo);
  };

  const fechado = mes.fechado;
  const linhasDe = (tipoItem: ItemDTO["tipo"]) =>
    mes.itens.map((item, indice) => ({ item, indice })).filter(({ item }) => item.tipo === tipoItem);
  const fixas = linhasDe("CONTA");
  const avulsas = linhasDe("EXTRA_MES");
  const anuais = linhasDe("ANUAL");
  const totalAportes = aportes.reduce((acc, item) => acc + item.valor, 0);

  const gravar = (proximo: MesDTO, mensagem: string, aoConcluir?: () => void) => {
    const anterior = mes;
    setMes(proximo);
    setErro("");
    startTransition(async () => {
      const resposta = await salvarMesAction(proximo);
      if (resposta.ok) {
        setMes(resposta.mes);
        setStatus(mensagem);
        aoConcluir?.();
        router.refresh();
      } else {
        setMes(anterior);
        setErro(resposta.erro);
      }
    });
  };

  const alterarItem = (indice: number, novo: number) => {
    if (Math.abs(mes.itens[indice].valor - novo) < 0.005) return;
    gravar({ ...mes, itens: mes.itens.map((item, i) => (i === indice ? { ...item, valor: novo } : item)) }, "Valor atualizado.");
  };

  const remover = (indice: number) => {
    const item = mes.itens[indice];
    if (!window.confirm(`Remover "${item.nome || "esta despesa"}" deste mês?`)) return;
    gravar({ ...mes, itens: mes.itens.filter((_, i) => i !== indice) }, "Despesa removida.");
  };

  const somarGasto = () => {
    if (!categoria) return;
    setErroGasto("");
    startTransition(async () => {
      const tema = categoria === "cartao" ? null : (categoria as TemaVariavel);
      // Feira/gasolina no crédito entram na fatura (fechamento); vale e dinheiro ficam na categoria.
      const viaCartao = meioPagamento === "cartao" && tema != null;
      const viaVale = meioPagamento === "vale" && tema != null;
      const resposta = await adicionarLancamentoAction({
        competencia,
        categoria: viaCartao ? "cartao" : categoria,
        valor: valorGasto,
        descricao: viaCartao
          ? descricaoComPrefixo(ROTULO_CATEGORIA[categoria], descGasto)
          : viaVale
            ? descricaoComPrefixo("Vale", descGasto)
            : descGasto,
      });
      if (resposta.ok) {
        const rotulo = ROTULO_CATEGORIA[categoria].toLowerCase();
        setStatus(
          viaCartao
            ? `${formatarMoeda(valorGasto)} de ${rotulo} somados na fatura do cartão.`
            : viaVale
              ? `${formatarMoeda(valorGasto)} de ${rotulo} no vale.`
              : `${formatarMoeda(valorGasto)} somados em ${rotulo}.`,
        );
        setValorGasto(0);
        setDescGasto("");
        setMeioPagamento("dinheiro");
        router.refresh();
      } else setErroGasto(resposta.erro);
    });
  };

  const mudarFechamento = (dia: number) => {
    setFechamento(dia);
    startTransition(async () => {
      const resposta = await salvarDiaFechamentoAction(dia);
      if (resposta.ok) {
        setStatus(`Fatura fecha no dia ${dia}.`);
        router.refresh();
      } else setErroGasto(resposta.erro);
    });
  };

  const desfazerGasto = (id: string) => {
    startTransition(async () => {
      const resposta = await removerLancamentoAction(id);
      if (resposta.ok) router.refresh();
      else setErroGasto(resposta.erro);
    });
  };

  const alterarAporte = (
    campo: "poupanca" | "reserva" | "fundo" | "alttab" | "meta",
    atual: number,
    novo: number,
  ) => {
    if (Math.abs(atual - novo) < 0.005) return;
    const proximo: MesDTO =
      campo === "poupanca"
        ? { ...mes, poupancaReal: novo, poupancaEditado: true }
        : campo === "reserva"
          ? { ...mes, reservaReal: novo, reservaEditado: true }
          : campo === "fundo"
            ? { ...mes, fundoReal: novo, fundoEditado: true }
            : campo === "alttab"
              ? { ...mes, alttabReal: novo, alttabEditado: true }
              : { ...mes, metaReal: novo, metaEditado: true };
    const jaDepositado = mes.depositos[campo];
    gravar(proximo, jaDepositado ? "Aporte atualizado e saldo da caixinha ajustado." : "Aporte atualizado.", () => {
      // Se o depósito já estava marcado, reajusta o saldo creditado para o novo valor.
      if (jaDepositado) void marcarDepositoAction(competencia, campo, true).then(() => router.refresh());
    });
  };

  const adicionar = (
    nome: string,
    valor: number,
    pago: boolean,
    tipo: "EXTRA_MES" | "CONTA",
    meioPagamento?: ItemDTO["meioPagamento"],
  ) => {
    const ordem = mes.itens.reduce((acc, item) => Math.max(acc, item.ordem), -1) + 1;
    const novo: ItemDTO = {
      tipo,
      nome: nome.trim() || "Sem nome",
      valor,
      ordem,
      pago,
      meioPagamento: pago ? (meioPagamento ?? null) : null,
      papel: null,
    };
    gravar({ ...mes, itens: [...mes.itens, novo] }, `Despesa de ${formatarMoeda(valor)} registrada.`, () =>
      setAberto(false),
    );
  };

  const painel = (titulo: string, nota: string, total: number, acao: React.ReactNode, corpo: React.ReactNode, largo = false) => (
    <section className={`caixa ${largo ? "caixa-larga" : ""}`} aria-label={titulo}>
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

  const listaEditavel = (linhas: typeof fixas, vazio: string, editavel = true) =>
    linhas.length === 0 ? (
      <p className="text-sm text-mute">{vazio}</p>
    ) : (
      <ul>
        {linhas.map(({ item, indice }) => (
          <li key={item.id ?? `${item.tipo}-${indice}`} className="ganho-linha">
            <span className="min-w-0 flex-1 truncate">{item.nome || "Sem nome"}</span>
            {editavel ? (
              <>
                <div className="ganho-valor">
                  <CampoMoeda
                    id={`despesa-${indice}`}
                    label={`Valor de ${item.nome || "despesa"}`}
                    rotuloVisivel={false}
                    compact
                    value={item.valor}
                    disabled={fechado || pendente}
                    onChange={() => undefined}
                    onCommit={(novo) => alterarItem(indice, novo)}
                  />
                </div>
                {fechado ? null : (
                  <button
                    type="button"
                    className="btn text-xs"
                    disabled={pendente}
                    onClick={() => remover(indice)}
                    aria-label={`Remover ${item.nome || "despesa"}`}
                  >
                    Remover
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="money shrink-0 text-sm">{formatarMoeda(item.valor)}</span>
                {!fechado && item.contaAnualId ? (
                  <button
                    type="button"
                    className="btn text-xs"
                    aria-label={`Editar conta anual ${item.nome}`}
                    onClick={() => setAnualId(item.contaAnualId as string)}
                  >
                    Editar
                  </button>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>
    );

  const faturaAbertaEmOutroMes = faturaHoje !== competencia;
  // Avulso = compra 1x na fatura (janela de fechamento), inclusive feira/gasolina no crédito.
  const competenciaFaturaAvulso = faturaAbertaEmOutroMes ? faturaHoje : competencia;
  const lancamentosCartaoAvulso = lancamentos.filter(
    (item) => item.categoria === "cartao" && item.competencia === competenciaFaturaAvulso,
  );
  // Compras 1x legadas (CompraCartao) só quando a tela é a própria fatura.
  const valorCartaoAvulso =
    somarLancamentos(lancamentosCartaoAvulso) + (faturaAbertaEmOutroMes ? 0 : cartaoAvulsosCompra);

  const lancamentosDaCategoria = (cat: CategoriaVariavel) =>
    lancamentos.filter((item) => {
      if (cat === "cartao") return item.categoria === "cartao" && item.competencia === faturaHoje;
      return item.categoria === cat && item.competencia === competencia;
    });

  const resumoFeira = resumoTemaNoMes(lancamentos, "feira", competencia);
  const resumoGasolina = resumoTemaNoMes(lancamentos, "gasolina", competencia);

  const textoPorMeio = (resumo: ReturnType<typeof resumoTemaNoMes>) => {
    const partes = (["dinheiro", "vale", "cartao"] as const)
      .filter((meio) => resumo.porMeio[meio] > 0)
      .map((meio) => `${ROTULOS_MEIO_PAGAMENTO[meio]} ${formatarMoeda(resumo.porMeio[meio])}`);
    return partes.length > 0 ? partes.join(" · ") : "Sem lançamentos ainda";
  };

  const abrirTema = (cat: CategoriaVariavel) => {
    setErroGasto("");
    setMeioPagamento("dinheiro");
    setCategoria(cat);
  };

  const abrirTemaNaAba = (cat: CategoriaVariavel) => {
    const tema: TemaDia = cat === "gasolina" ? "gasolina" : cat === "cartao" ? "cartao" : "feira";
    irParaTemaDia(tema);
    abrirTema(cat);
  };

  /** Painel dedicado de Feira ou Gasolina: total + meios + lista completa. */
  const painelTemaVariavel = (
    tema: TemaVariavel,
    resumo: ReturnType<typeof resumoTemaNoMes>,
    sugestao: number,
    rotuloSugestao: string,
  ) => {
    const hoje = resumoLancamentosHoje(resumo.itens);
    return (
      <section className="caixa" aria-label={ROTULO_CATEGORIA[tema]}>
        <header className="caixa-topo">
          <div className="min-w-0 flex-1">
            <h2 className="caixa-titulo">{ROTULO_CATEGORIA[tema]}</h2>
            <p className="caixa-funcao">
              {textoPorMeio(resumo)} · {rotuloSugestao} {formatarMoeda(sugestao)}
              {hoje.vezes > 0
                ? ` · hoje: ${hoje.vezes} ${hoje.vezes === 1 ? "vez" : "vezes"} (${formatarMoeda(hoje.total)})`
                : ""}
            </p>
          </div>
          <p className="money shrink-0 text-lg font-semibold text-outflow">{formatarMoeda(resumo.total)}</p>
        </header>
        <div className="caixa-corpo">
          {fechado ? null : (
            <button type="button" className="btn text-sm self-start" onClick={() => abrirTema(tema)}>
              + Adicionar
            </button>
          )}
          {resumo.itens.length === 0 ? (
            <p className="text-sm text-mute">Nenhum lançamento neste mês.</p>
          ) : (
            <ul>
              {resumo.itens.map((item) => {
                const meio = meioPagamentoLancamento(item);
                const detalhe = detalheDescricaoLancamento(item);
                return (
                  <li key={item.id} className="ganho-linha">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {ROTULOS_MEIO_PAGAMENTO[meio]}
                        {detalhe ? ` · ${detalhe}` : ""}
                      </span>
                      <span className="block text-xs text-mute">{formatarDia(item.data)}</span>
                    </span>
                    <span className="money shrink-0 text-sm">{formatarMoeda(item.valor)}</span>
                    {fechado ? null : (
                      <button
                        type="button"
                        className="btn text-xs"
                        disabled={pendente}
                        onClick={() => desfazerGasto(item.id)}
                      >
                        Remover
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    );
  };

  const painelCartaoDia = () =>
    painel(
      "Cartão nesta fatura",
      faturaAbertaEmOutroMes
        ? `Compras 1x da fatura de ${formatarNomeMes(faturaHoje)} (fecha dia ${fechamento}), incl. feira/gasolina no crédito`
        : `Compras 1x desta fatura (fecha dia ${fechamento}), incl. feira/gasolina no crédito`,
      valorCartaoAvulso + cartaoParcelas + cartaoFixo,
      <div className="flex flex-wrap gap-2">
        {fechado ? null : (
          <button type="button" className="btn text-sm self-start" onClick={() => abrirTema("cartao")}>
            + Adicionar avulso
          </button>
        )}
        <button type="button" className="btn text-sm self-start" onClick={() => setCartaoAberto(true)}>
          Compras e fixos
        </button>
        <Link className="btn text-sm self-start" href={`/cartao?mes=${competenciaFaturaAvulso}`}>
          Ver fatura
        </Link>
      </div>,
      <ul>
        <li className="ganho-linha">
          <span className="min-w-0 flex-1">
            <span className="block">Cartão avulso (1x)</span>
            <span className="block text-xs text-mute">
              {lancamentosCartaoAvulso.length === 0
                ? "Nenhuma compra 1x nesta fatura"
                : `${lancamentosCartaoAvulso.length} ${lancamentosCartaoAvulso.length === 1 ? "compra" : "compras"} na fatura`}
            </span>
          </span>
          <span className="money shrink-0 text-sm">{formatarMoeda(valorCartaoAvulso)}</span>
        </li>
        {lancamentosCartaoAvulso.slice(0, 12).map((item) => {
          const tema = ehLancamentoDoTema(item, "feira")
            ? "Feira"
            : ehLancamentoDoTema(item, "gasolina")
              ? "Gasolina"
              : "Avulso";
          const detalhe = detalheDescricaoLancamento(item);
          return (
            <li key={item.id} className="ganho-linha">
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {tema}
                  {detalhe ? ` · ${detalhe}` : ""}
                </span>
                <span className="block text-xs text-mute">{formatarDia(item.data)}</span>
              </span>
              <span className="money shrink-0 text-sm">{formatarMoeda(item.valor)}</span>
              {fechado ? null : (
                <button
                  type="button"
                  className="btn text-xs"
                  disabled={pendente}
                  onClick={() => desfazerGasto(item.id)}
                >
                  Remover
                </button>
              )}
            </li>
          );
        })}
        {lancamentosCartaoAvulso.length > 12 ? (
          <li className="text-xs text-mute">+ {lancamentosCartaoAvulso.length - 12} · ver fatura completa</li>
        ) : null}
        {faturaAbertaEmOutroMes ? (
          <li className="ganho-linha">
            <span className="min-w-0 flex-1 text-sm text-mute">
              Compras após o dia {fechamento} entram em {formatarNomeMes(faturaHoje)}.
            </span>
          </li>
        ) : null}
        <li className="ganho-linha">
          <span className="min-w-0 flex-1">Parcelas do cartão</span>
          <span className="money shrink-0 text-sm">{formatarMoeda(cartaoParcelas)}</span>
        </li>
        <li className="ganho-linha">
          <span className="min-w-0 flex-1">Fixos do cartão</span>
          <span className="money shrink-0 text-sm">{formatarMoeda(cartaoFixo)}</span>
        </li>
      </ul>,
    );

  const mesDaLista = categoria === "cartao" ? faturaHoje : competencia;
  const resumoModalTema =
    categoria === "feira" ? resumoFeira : categoria === "gasolina" ? resumoGasolina : null;
  const lancamentosModal = resumoModalTema
    ? resumoModalTema.itens
    : categoria
      ? lancamentosDaCategoria(categoria)
      : [];
  const totalModal = resumoModalTema
    ? resumoModalTema.total
    : categoria === "cartao"
      ? valorCartaoAvulso
      : 0;
  const resumoHojeModal = resumoLancamentosHoje(lancamentosModal);

  const novaDespesa = fechado ? null : (
    <button
      type="button"
      className="btn text-sm self-start"
      onClick={() => {
        setErro("");
        setAberto(true);
      }}
    >
      Nova despesa
    </button>
  );

  return (
    <article className="mx-auto max-w-[72rem] px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Gastos de {formatarCompetencia(competencia)}</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-mute">
            {fechado
              ? "Mês fechado (somente leitura)."
              : "Tudo que sai neste mês: contas, feira, gasolina, cartão e aportes. Adicione ou ajuste aqui."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn" href={`/despesas?mes=${avancarCompetencia(competencia, -1)}`} aria-label="Mês anterior">
            ‹
          </Link>
          <Link className="btn" href={`/despesas?mes=${avancarCompetencia(competencia, 1)}`} aria-label="Próximo mês">
            ›
          </Link>
          {fechado ? null : (
            <button
              type="button"
              className="btn-primary novo-topo"
              onClick={() => {
                irParaAba("extra");
                setErro("");
                setAberto(true);
              }}
            >
              Nova despesa
            </button>
          )}
          <Link className="btn" href="/">
            Voltar ao início
          </Link>
        </div>
      </header>

      <section className="resumo-faixa mt-5" aria-label="Resumo dos gastos">
        <div className="resumo-celula is-principal">
          <p className="kpi-rotulo">Gasto do mês</p>
          <p className="amount resumo-valor text-outflow">{formatarMoeda(gasto)}</p>
          <p className="text-xs text-mute">Contas + cartão + feira + gasolina + aportes</p>
        </div>
        <div className="resumo-celula">
          <p className="kpi-rotulo">Ganhou no mês</p>
          <p className="money resumo-valor-sm text-inflow">{formatarMoeda(ganhou)}</p>
        </div>
        <div className="resumo-celula">
          <p className="kpi-rotulo">Sobra prevista</p>
          <p className={`money resumo-valor-sm ${sobrou >= 0 ? "text-inflow" : "text-outflow"}`}>{formatarMoeda(sobrou)}</p>
        </div>
      </section>

      {erro ? (
        <p className="mt-4 text-sm text-outflow" role="alert">
          {erro}
        </p>
      ) : null}

      <AbasSecao
        rotulo="Seções dos gastos"
        ativa={aba}
        onChange={irParaAba}
        abas={[
          {
            id: "fixas",
            rotulo: "Fixas",
            painel: (
              <>
                {painel(
                  "Contas fixas",
                  "Voltam todo mês, com o valor copiado do mês anterior.",
                  soma(fixas.map(({ item }) => item)),
                  null,
                  listaEditavel(fixas, "Nenhuma conta fixa neste mês."),
                )}
                {painel(
                  "Contas anuais",
                  "IPVA, IPTU, domínio… a parcela do mês vem do cadastro das contas anuais.",
                  soma(anuais.map(({ item }) => item)),
                  fechado ? null : (
                    <button type="button" className="btn text-sm self-start" onClick={() => setAberto(true)}>
                      Nova conta anual
                    </button>
                  ),
                  listaEditavel(anuais, "Nenhuma parcela anual neste mês.", false),
                )}
              </>
            ),
          },
          {
            id: "extra",
            rotulo: "Extra",
            painel: painel(
              "Só este mês",
              "Despesas avulsas: não se repetem nos meses seguintes.",
              soma(avulsas.map(({ item }) => item)),
              novaDespesa,
              listaEditavel(avulsas, "Nenhuma despesa avulsa neste mês."),
            ),
          },
          {
            id: "dia",
            rotulo: "Dia a dia",
            painel: (
              <AbasSecao
                rotulo="Feira, gasolina e cartão"
                ativa={temaDia}
                onChange={irParaTemaDia}
                abas={[
                  {
                    id: "feira",
                    rotulo: "Feira",
                    painel: painelTemaVariavel("feira", resumoFeira, sugestoes.feira, "VA"),
                  },
                  {
                    id: "gasolina",
                    rotulo: "Gasolina",
                    painel: painelTemaVariavel("gasolina", resumoGasolina, sugestoes.gasolina, "VT"),
                  },
                  {
                    id: "cartao",
                    rotulo: "Cartão",
                    painel: painelCartaoDia(),
                  },
                ]}
              />
            ),
          },
          {
            id: "aportes",
            rotulo: "Aportes",
            painel: painel(
              "Aportes (investimentos)",
              "Dinheiro que você guarda. Guardou menos que o sugerido? Digite o valor real.",
              totalAportes,
              null,
              <ul>
                {aportes.map((item) => (
                  <li key={item.campo} className="ganho-linha">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{item.rotulo}</span>
                      <span className="block text-xs text-mute">
                        {item.somenteLeitura
                          ? "Parcela do mês (conta anual)"
                          : `Sugerido ${formatarMoeda(item.sugestao)}`}
                        {!item.somenteLeitura &&
                        item.campo in mes.depositos &&
                        mes.depositos[item.campo as keyof typeof mes.depositos]
                          ? " · depósito marcado"
                          : ""}
                      </span>
                    </span>
                    {item.somenteLeitura ? (
                      <span className="money shrink-0 text-sm">{formatarMoeda(item.valor)}</span>
                    ) : (
                      <div className="ganho-valor">
                        <CampoMoeda
                          id={`aporte-${item.campo}`}
                          label={`Aporte em ${item.rotulo}`}
                          rotuloVisivel={false}
                          compact
                          value={item.valor}
                          disabled={fechado || pendente}
                          onChange={() => undefined}
                          onCommit={(novo) =>
                            alterarAporte(
                              item.campo as "poupanca" | "reserva" | "fundo" | "alttab" | "meta",
                              item.valor,
                              novo,
                            )
                          }
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>,
            ),
          },
        ]}
      />

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {fechado ? null : (
        <BotaoFlutuante
          rotulo="Adicionar gasto"
          acoes={[
            {
              rotulo: "Nova despesa",
              onClick: () => {
                irParaAba("extra");
                setErro("");
                setAberto(true);
              },
            },
            {
              rotulo: "Feira",
              onClick: () => abrirTemaNaAba("feira"),
            },
            {
              rotulo: "Gasolina",
              onClick: () => abrirTemaNaAba("gasolina"),
            },
          ]}
        />
      )}

      <Modal
        aberto={categoria !== null}
        titulo={categoria ? `Gastos em ${ROTULO_CATEGORIA[categoria].toLowerCase()}` : "Gastos"}
        descricao="Some cada compra ao total do mês. Você pode remover um lançamento se errar."
        onClose={() => setCategoria(null)}
      >
        {categoria ? (
          <div className="grid gap-4">
            <p className="caixa-nota">
              {categoria === "cartao"
                ? `Fatura de ${formatarNomeMes(faturaHoje)}`
                : resumoModalTema
                  ? `Total do mês (dinheiro + vale + cartão)`
                  : "Total do mês"}
              : <strong className="money">{formatarMoeda(totalModal)}</strong>
              {resumoModalTema ? (
                <span className="block text-xs text-mute mt-1">{textoPorMeio(resumoModalTema)}</span>
              ) : null}
              {resumoHojeModal.vezes > 0
                ? ` · hoje: ${resumoHojeModal.vezes} ${resumoHojeModal.vezes === 1 ? "vez" : "vezes"} (${formatarMoeda(resumoHojeModal.total)})`
                : ""}
            </p>
            {categoria === "cartao" ? (
              <div className="grid gap-2">
                <p className="text-sm text-mute">
                  {faturaHoje === competencia
                    ? `A compra de hoje entra na fatura deste mês (${formatarNomeMes(faturaHoje)}), paga no dia ${diaPagamento}.`
                    : `Hoje já passou do fechamento: a compra entra na fatura de ${formatarNomeMes(faturaHoje)} (paga dia ${diaPagamento}).`}
                </p>
                <CampoPassos
                  id="cartao-fechamento"
                  label="A fatura fecha no dia"
                  value={fechamento}
                  min={1}
                  max={28}
                  onChange={mudarFechamento}
                />
              </div>
            ) : null}
            <form
              className="grid gap-3"
              onSubmit={(evento) => {
                evento.preventDefault();
                somarGasto();
              }}
            >
              <CampoMoeda id="gasto-valor" label="Valor desta compra" value={valorGasto} onChange={setValorGasto} autoFocus />
              <CampoTexto
                id="gasto-descricao"
                label="Onde (opcional)"
                value={descGasto}
                placeholder={categoria === "gasolina" ? "Ex.: Posto Shell" : "Ex.: Mercado do bairro"}
                onChange={setDescGasto}
              />
              {categoria !== "cartao" ? (
                <fieldset className="tipo-conta" aria-label="Como pagou">
                  <legend className="sr-only">Como pagou</legend>
                  {(
                    [
                      {
                        id: "dinheiro" as const,
                        rotulo: "Dinheiro",
                        detalhe: `Soma no caixa de ${ROTULO_CATEGORIA[categoria].toLowerCase()}.`,
                      },
                      {
                        id: "vale" as const,
                        rotulo: categoria === "feira" ? "Vale-alimentação" : "Vale-transporte",
                        detalhe:
                          categoria === "feira"
                            ? "Usa o VA — entra no total de mercado do mês."
                            : "Usa o VT — entra no total de gasolina do mês.",
                      },
                      {
                        id: "cartao" as const,
                        rotulo: "Cartão de crédito",
                        detalhe: `Entra na fatura de ${formatarNomeMes(faturaHoje)}.`,
                      },
                    ] as const
                  ).map((opcao) => (
                    <label
                      key={opcao.id}
                      className={`tipo-conta-opcao ${meioPagamento === opcao.id ? "is-ativo" : ""}`}
                    >
                      <input
                        type="radio"
                        name="pagamento-variavel"
                        checked={meioPagamento === opcao.id}
                        onChange={() => setMeioPagamento(opcao.id)}
                      />
                      <span className="tipo-conta-rotulo">{opcao.rotulo}</span>
                      <span className="tipo-conta-detalhe">{opcao.detalhe}</span>
                    </label>
                  ))}
                </fieldset>
              ) : null}
              {erroGasto ? (
                <p className="text-sm text-outflow" role="alert">
                  {erroGasto}
                </p>
              ) : null}
              <button type="submit" className="btn-primary" disabled={pendente}>
                {pendente
                  ? "Salvando…"
                  : meioPagamento === "cartao" && categoria !== "cartao"
                    ? "Somar na fatura"
                    : "Somar ao total"}
              </button>
            </form>
            <div>
              <p className="kpi-rotulo">
                {categoria === "cartao"
                  ? `Lançamentos de ${formatarNomeMes(mesDaLista)}`
                  : "Lançamentos do mês (todos os meios)"}
              </p>
              {lancamentosModal.length === 0 ? (
                <p className="mt-1 text-sm text-mute">Nenhum lançamento ainda.</p>
              ) : (
                <ul>
                  {lancamentosModal.map((item) => {
                    const meio = meioPagamentoLancamento(item);
                    const detalhe = detalheDescricaoLancamento(item);
                    return (
                      <li key={item.id} className="ganho-linha">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">
                            {ROTULOS_MEIO_PAGAMENTO[meio]}
                            {detalhe ? ` · ${detalhe}` : ""}
                          </span>
                          <span className="block text-xs text-mute">{formatarDia(item.data)}</span>
                        </span>
                        <span className="money shrink-0 text-sm">{formatarMoeda(item.valor)}</span>
                        <button
                          type="button"
                          className="btn text-xs"
                          disabled={pendente}
                          onClick={() => desfazerGasto(item.id)}
                        >
                          Remover
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {anualId ? (
        <ModalNovaConta
          competencia={competencia}
          anualEditando={contasAnuais.find((conta) => conta.id === anualId) ?? null}
          inicioCartaoPadrao={faturaHoje}
          onClose={() => setAnualId(null)}
          onSalvar={() => undefined}
          onSalvouExterno={() => setAnualId(null)}
        />
      ) : null}

      <Modal
        aberto={cartaoAberto}
        titulo="Compras e fixos do cartão"
        descricao="Edite, remova ou cadastre compras parceladas e gastos fixos da fatura."
        onClose={() => setCartaoAberto(false)}
        largura="lg"
      >
        <PainelCartao
          compras={compras}
          recorrentes={recorrentes}
          teto={tetoCartao}
          competenciaInicioPadrao={faturaHoje}
          embutido
        />
      </Modal>

      {aberto ? (
        <ModalNovaConta
          competencia={competencia}
          inicioCartaoPadrao={faturaHoje}
          anualEditando={null}
          onClose={() => setAberto(false)}
          onSalvar={adicionar}
          onSalvouExterno={() => setAberto(false)}
        />
      ) : null}
    </article>
  );
}
