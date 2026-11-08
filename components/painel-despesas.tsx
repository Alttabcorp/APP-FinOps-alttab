"use client";

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
import type { LancamentoDTO, CategoriaVariavel } from "@/lib/application/lancamento-service";
import type { ItemDTO, MesDTO } from "@/lib/application/mes-mapper";
import { avancarCompetencia, formatarCompetencia, formatarNomeMes } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  competencia: string;
  mesInicial: MesDTO;
  ganhou: number;
  gasto: number;
  sobrou: number;
  cartaoParcelas: number;
  cartaoFixo: number;
  sugestoes: { feira: number; gasolina: number };
  aportes: { campo: "poupanca" | "fundo" | "alttab"; rotulo: string; valor: number; sugestao: number }[];
  lancamentos: LancamentoDTO[];
  abrirCategoria?: CategoriaVariavel | null;
  contasAnuais: ContaAnualDTO[];
  compras: CompraCartaoDTO[];
  recorrentes: RecorrenteCartaoDTO[];
  /** Fatura em que uma compra feita hoje entra (depende do dia de fechamento). */
  faturaHoje: string;
  diaFechamento: number;
  tetoCartao: number;
};

const ROTULO_CATEGORIA: Record<CategoriaVariavel, string> = {
  feira: "Feira",
  gasolina: "Gasolina",
  cartao: "Cartão avulso",
};

const CAMPO_CATEGORIA = { feira: "feiraReal", gasolina: "gasolinaReal", cartao: "cartaoReal" } as const;

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
  cartaoFixo,
  sugestoes,
  aportes,
  lancamentos,
  abrirCategoria = null,
  contasAnuais,
  compras,
  recorrentes,
  faturaHoje,
  diaFechamento,
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
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [categoria, setCategoria] = useState<CategoriaVariavel | null>(mesInicial.fechado ? null : abrirCategoria);
  const [valorGasto, setValorGasto] = useState(0);
  const [descGasto, setDescGasto] = useState("");
  const [noCartao, setNoCartao] = useState(false);
  const [erroGasto, setErroGasto] = useState("");
  const [anualId, setAnualId] = useState<string | null>(null);
  const [cartaoAberto, setCartaoAberto] = useState(false);
  const [fechamento, setFechamento] = useState(diaFechamento);
  const [status, setStatus] = useState("");
  const [pendente, startTransition] = useTransition();

  useEffect(() => setMes(mesInicial), [mesInicial]);

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
      // Feira/gasolina pagas no cartão entram na fatura (conforme o fechamento), não no caixa de agora.
      const viaCartao = noCartao && categoria !== "cartao";
      const resposta = await adicionarLancamentoAction({
        competencia,
        categoria: viaCartao ? "cartao" : categoria,
        valor: valorGasto,
        descricao: viaCartao
          ? [ROTULO_CATEGORIA[categoria], descGasto.trim()].filter(Boolean).join(" · ")
          : descGasto,
      });
      if (resposta.ok) {
        setStatus(
          viaCartao
            ? `${formatarMoeda(valorGasto)} de ${ROTULO_CATEGORIA[categoria].toLowerCase()} somados na fatura do cartão.`
            : `${formatarMoeda(valorGasto)} somados em ${ROTULO_CATEGORIA[categoria].toLowerCase()}.`,
        );
        setValorGasto(0);
        setDescGasto("");
        setNoCartao(false);
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

  const alterarAporte = (campo: "poupanca" | "fundo" | "alttab", atual: number, novo: number) => {
    if (Math.abs(atual - novo) < 0.005) return;
    const proximo: MesDTO =
      campo === "poupanca"
        ? { ...mes, poupancaReal: novo, poupancaEditado: true }
        : campo === "fundo"
          ? { ...mes, fundoReal: novo, fundoEditado: true }
          : { ...mes, alttabReal: novo, alttabEditado: true };
    const jaDepositado = mes.depositos[campo];
    gravar(proximo, jaDepositado ? "Aporte atualizado e saldo da caixinha ajustado." : "Aporte atualizado.", () => {
      // Se o depósito já estava marcado, reajusta o saldo creditado para o novo valor.
      if (jaDepositado) void marcarDepositoAction(competencia, campo, true).then(() => router.refresh());
    });
  };

  const alterarVariavel = (campo: "feiraReal" | "gasolinaReal" | "cartaoReal", novo: number) => {
    if (Math.abs(mes[campo] - novo) < 0.005) return;
    gravar({ ...mes, [campo]: novo }, "Valor atualizado.");
  };

  const adicionar = (nome: string, valor: number, pago: boolean, tipo: "EXTRA_MES" | "CONTA") => {
    const ordem = mes.itens.reduce((acc, item) => Math.max(acc, item.ordem), -1) + 1;
    const novo: ItemDTO = { tipo, nome: nome.trim() || "Sem nome", valor, ordem, pago, papel: null };
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

  const linhaVariavel = (
    rotulo: string,
    campo: "feiraReal" | "gasolinaReal" | "cartaoReal",
    dica: string,
    cat: CategoriaVariavel,
  ) => (
    <li className="ganho-linha">
      <span className="min-w-0 flex-1">
        <span className="block truncate">{rotulo}</span>
        <span className="block text-xs text-mute">{dica}</span>
      </span>
      {fechado ? null : (
        <button
          type="button"
          className="btn text-xs"
          onClick={() => {
            setErroGasto("");
            setCategoria(cat);
          }}
        >
          + Adicionar
        </button>
      )}
      <div className="ganho-valor">
        <CampoMoeda
          id={`variavel-${campo}`}
          label={rotulo}
          rotuloVisivel={false}
          compact
          value={mes[campo]}
          disabled={fechado || pendente}
          onChange={() => undefined}
          onCommit={(novo) => alterarVariavel(campo, novo)}
        />
      </div>
    </li>
  );

  const mesDaLista = categoria === "cartao" ? faturaHoje : competencia;
  const lancamentosModal = lancamentos.filter(
    (item) => item.categoria === categoria && item.competencia === mesDaLista,
  );
  const totalModal =
    !categoria || mesDaLista === competencia
      ? categoria
        ? mes[CAMPO_CATEGORIA[categoria]]
        : 0
      : lancamentosModal.reduce((acc, item) => acc + item.valor, 0);

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

      <div className="caixas-grade">
        {painel(
          "Contas fixas",
          "Voltam todo mês, com o valor copiado do mês anterior.",
          soma(fixas.map(({ item }) => item)),
          null,
          listaEditavel(fixas, "Nenhuma conta fixa neste mês."),
        )}
        {painel(
          "Só este mês",
          "Despesas avulsas: não se repetem nos meses seguintes.",
          soma(avulsas.map(({ item }) => item)),
          novaDespesa,
          listaEditavel(avulsas, "Nenhuma despesa avulsa neste mês."),
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
        {painel(
          "Feira, gasolina e cartão",
          "A cada compra, use “+ Adicionar” para somar ao total do mês. A sugestão vem dos vales.",
          mes.feiraReal + mes.gasolinaReal + mes.cartaoReal + cartaoParcelas + cartaoFixo,
          <button type="button" className="btn text-sm self-start" onClick={() => setCartaoAberto(true)}>
            Compras e fixos do cartão
          </button>,
          <ul>
            {linhaVariavel("Feira", "feiraReal", `Sugestão ${formatarMoeda(sugestoes.feira)}`, "feira")}
            {linhaVariavel("Gasolina", "gasolinaReal", `Sugestão ${formatarMoeda(sugestoes.gasolina)}`, "gasolina")}
            {linhaVariavel("Cartão avulso", "cartaoReal", `Compras após o dia ${fechamento} vão para a fatura seguinte`, "cartao")}
            <li className="ganho-linha">
              <span className="min-w-0 flex-1">Parcelas do cartão</span>
              <span className="money shrink-0 text-sm">{formatarMoeda(cartaoParcelas)}</span>
            </li>
            <li className="ganho-linha">
              <span className="min-w-0 flex-1">Fixos do cartão</span>
              <span className="money shrink-0 text-sm">{formatarMoeda(cartaoFixo)}</span>
            </li>
          </ul>,
        )}
        {painel(
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
                    Sugerido {formatarMoeda(item.sugestao)}
                    {mes.depositos[item.campo] ? " · depósito marcado" : ""}
                  </span>
                </span>
                <div className="ganho-valor">
                  <CampoMoeda
                    id={`aporte-${item.campo}`}
                    label={`Aporte em ${item.rotulo}`}
                    rotuloVisivel={false}
                    compact
                    value={item.valor}
                    disabled={fechado || pendente}
                    onChange={() => undefined}
                    onCommit={(novo) => alterarAporte(item.campo, item.valor, novo)}
                  />
                </div>
              </li>
            ))}
          </ul>,
          true,
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {fechado ? null : (
        <BotaoFlutuante
          rotulo="Nova despesa"
          onClick={() => {
            setErro("");
            setAberto(true);
          }}
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
              {categoria === "cartao" ? `Fatura de ${formatarNomeMes(faturaHoje)}` : "Total do mês"}:{" "}
              <strong className="money">{formatarMoeda(totalModal)}</strong>
            </p>
            {categoria === "cartao" ? (
              <div className="grid gap-2">
                <p className="text-sm text-mute">
                  {faturaHoje === competencia
                    ? `A compra de hoje entra na fatura deste mês (${formatarNomeMes(faturaHoje)}).`
                    : `Hoje já passou do fechamento: a compra entra na fatura de ${formatarNomeMes(faturaHoje)}.`}
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
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={noCartao}
                    onChange={(evento) => setNoCartao(evento.target.checked)}
                  />
                  <span>
                    Paguei no cartão de crédito
                    <span className="block text-xs text-mute">
                      {noCartao
                        ? `Entra na fatura de ${formatarNomeMes(faturaHoje)}, não no total de ${ROTULO_CATEGORIA[categoria].toLowerCase()}.`
                        : "Marque se foi no crédito: o valor vai para a fatura."}
                    </span>
                  </span>
                </label>
              ) : null}
              {erroGasto ? (
                <p className="text-sm text-outflow" role="alert">
                  {erroGasto}
                </p>
              ) : null}
              <button type="submit" className="btn-primary" disabled={pendente}>
                {pendente ? "Salvando…" : noCartao && categoria !== "cartao" ? "Somar na fatura" : "Somar ao total"}
              </button>
            </form>
            <div>
              <p className="kpi-rotulo">Lançamentos do mês</p>
              {lancamentosModal.length === 0 ? (
                <p className="mt-1 text-sm text-mute">Nenhum lançamento ainda.</p>
              ) : (
                <ul>
                  {lancamentosModal.map((item) => (
                      <li key={item.id} className="ganho-linha">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.descricao || "Compra"}</span>
                          <span className="block text-xs text-mute">{formatarDia(item.data)}</span>
                        </span>
                        <span className="money shrink-0 text-sm">{formatarMoeda(item.valor)}</span>
                        <button type="button" className="btn text-xs" disabled={pendente} onClick={() => desfazerGasto(item.id)}>
                          Remover
                        </button>
                      </li>
                    ))}
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
