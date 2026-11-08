"use client";

import { BotaoFlutuante } from "@/components/botao-flutuante";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { salvarMesAction } from "@/app/actions/mes";
import { CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { Modal } from "@/components/modal";
import type { ItemDTO, MesDTO } from "@/lib/application/mes-mapper";
import { avancarCompetencia, formatarCompetencia } from "@/lib/domain/financeiro/competencia";
import type { PapelExtra } from "@/lib/domain/financeiro/tipos";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  competencia: string;
  mesInicial: MesDTO;
  sobrou: number;
  gasto: number;
};

type TipoEntrada = "DINHEIRO" | PapelExtra;

const OPCOES: { id: TipoEntrada; rotulo: string }[] = [
  { id: "DINHEIRO", rotulo: "Dinheiro (salário, bico, venda)" },
  { id: "VALE_TRANSPORTE", rotulo: "Vale-transporte" },
  { id: "VALE_ALIMENTACAO", rotulo: "Vale-alimentação" },
  { id: "PROVENTO_FUNDO", rotulo: "Rendimento do fundo imobiliário" },
  { id: "PROVENTO_POUPANCA", rotulo: "Rendimento da poupança" },
  { id: "OUTRO", rotulo: "Outro extra" },
];

const soma = (itens: ItemDTO[]) => itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

export function PainelGanhos({ competencia, mesInicial, sobrou, gasto }: Props) {
  const router = useRouter();
  const [mes, setMes] = useState(mesInicial);
  // Sincroniza com o servidor: ao trocar de mês ou recarregar os dados, descarta o estado local antigo.
  const [mesRecebido, setMesRecebido] = useState(mesInicial);
  if (mesRecebido !== mesInicial) {
    setMesRecebido(mesInicial);
    setMes(mesInicial);
  }
  const [status, setStatus] = useState("");
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoEntrada>("DINHEIRO");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState(0);
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();

  useEffect(() => setMes(mesInicial), [mesInicial]);

  const dinheiro = mes.itens.map((item, indice) => ({ item, indice })).filter(({ item }) => item.tipo === "SALDO");
  const extras = mes.itens.map((item, indice) => ({ item, indice })).filter(({ item }) => item.tipo === "EXTRA");
  const totalDinheiro = soma(dinheiro.map(({ item }) => item));
  const totalExtras = soma(extras.map(({ item }) => item));
  const ganhou = totalDinheiro + totalExtras;
  const fechado = mes.fechado;

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
        setStatus(resposta.erro);
      }
    });
  };

  const alterarValor = (indice: number, novoValor: number) => {
    if (Math.abs(mes.itens[indice].valor - novoValor) < 0.005) return;
    gravar(
      { ...mes, itens: mes.itens.map((item, i) => (i === indice ? { ...item, valor: novoValor } : item)) },
      "Valor atualizado.",
    );
  };

  const remover = (indice: number) => {
    const item = mes.itens[indice];
    if (!window.confirm(`Remover "${item.nome || "esta entrada"}" deste mês?`)) return;
    gravar({ ...mes, itens: mes.itens.filter((_, i) => i !== indice) }, "Entrada removida.");
  };

  const adicionar = () => {
    const rotulo = nome.trim() || OPCOES.find((opcao) => opcao.id === tipo)?.rotulo.split(" (")[0] || "";
    if (!rotulo) return setErro("Informe de onde veio o dinheiro.");
    if (!(valor > 0)) return setErro("Informe o valor da entrada.");
    const ordem = mes.itens.reduce((acc, item) => Math.max(acc, item.ordem), -1) + 1;
    const novo: ItemDTO =
      tipo === "DINHEIRO"
        ? { tipo: "SALDO", nome: rotulo, valor, ordem, pago: false }
        : { tipo: "EXTRA", nome: rotulo, valor, papel: tipo, ordem, pago: false };
    gravar({ ...mes, itens: [...mes.itens, novo] }, `Entrada de ${formatarMoeda(valor)} registrada.`, () => {
      setAberto(false);
      setNome("");
      setValor(0);
      setTipo("DINHEIRO");
    });
  };

  const lista = (titulo: string, nota: string, linhas: typeof dinheiro, total: number, vazio: string) => (
    <section className="caixa" aria-label={titulo}>
      <header className="caixa-topo">
        <div className="min-w-0 flex-1">
          <h2 className="caixa-titulo">{titulo}</h2>
          <p className="caixa-funcao">{nota}</p>
        </div>
        <p className="money shrink-0 text-lg font-semibold text-inflow">{formatarMoeda(total)}</p>
      </header>
      <div className="caixa-corpo">
        {linhas.length === 0 ? (
          <p className="text-sm text-mute">{vazio}</p>
        ) : (
          <ul>
            {linhas.map(({ item, indice }) => (
              <li key={item.id ?? `${item.tipo}-${indice}`} className="ganho-linha">
                <span className="min-w-0 flex-1 truncate">{item.nome || "Sem nome"}</span>
                <div className="ganho-valor">
                  <CampoMoeda
                    id={`ganho-${indice}`}
                    label={`Valor de ${item.nome || "entrada"}`}
                    rotuloVisivel={false}
                    compact
                    value={item.valor}
                    disabled={fechado || pendente}
                    onChange={() => undefined}
                    onCommit={(novo) => alterarValor(indice, novo)}
                  />
                </div>
                {fechado ? null : (
                  <button
                    type="button"
                    className="btn text-xs"
                    disabled={pendente}
                    onClick={() => remover(indice)}
                    aria-label={`Remover ${item.nome || "entrada"}`}
                  >
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  return (
    <article className="mx-auto max-w-[72rem] px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Ganhos de {formatarCompetencia(competencia)}</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-mute">
            {fechado
              ? "Mês fechado (somente leitura)."
              : "Tudo que entrou neste mês: salário, bicos, vales e rendimentos. Adicione ou ajuste aqui."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn" href={`/ganhos?mes=${avancarCompetencia(competencia, -1)}`} aria-label="Mês anterior">
            ‹
          </Link>
          <Link className="btn" href={`/ganhos?mes=${avancarCompetencia(competencia, 1)}`} aria-label="Próximo mês">
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
              Nova entrada
            </button>
          )}
          <Link className="btn" href="/">
            Voltar ao início
          </Link>
        </div>
      </header>

      <section className="resumo-faixa mt-5" aria-label="Resumo dos ganhos">
        <div className="resumo-celula is-principal">
          <p className="kpi-rotulo">Ganhou no mês</p>
          <p className="amount resumo-valor text-inflow">{formatarMoeda(ganhou)}</p>
          <p className="text-xs text-mute">Dinheiro + vales e rendimentos</p>
        </div>
        <div className="resumo-celula">
          <p className="kpi-rotulo">Gasto do mês</p>
          <p className="money resumo-valor-sm text-outflow">{formatarMoeda(gasto)}</p>
        </div>
        <div className="resumo-celula">
          <p className="kpi-rotulo">Sobra prevista</p>
          <p className={`money resumo-valor-sm ${sobrou >= 0 ? "text-inflow" : "text-outflow"}`}>
            {formatarMoeda(sobrou)}
          </p>
        </div>
      </section>

      {erro ? (
        <p className="mt-4 text-sm text-outflow" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="caixas-grade">
        {lista(
          "Dinheiro",
          "Salário, bicos e vendas. É a base da poupança e do caixa das contas.",
          dinheiro,
          totalDinheiro,
          "Nenhuma entrada de dinheiro neste mês.",
        )}
        {lista(
          "Vales e rendimentos",
          "Vale-transporte, vale-alimentação e rendimentos do fundo e da poupança.",
          extras,
          totalExtras,
          "Nenhum vale ou rendimento neste mês.",
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {fechado ? null : (
        <BotaoFlutuante
          rotulo="Nova entrada"
          onClick={() => {
            setErro("");
            setAberto(true);
          }}
        />
      )}

      <Modal
        aberto={aberto}
        titulo="Nova entrada"
        descricao="Dinheiro que entrou neste mês. Entra no “Ganhou no mês” e muda a sobra e a sugestão de poupança."
        onClose={() => setAberto(false)}
      >
        <form
          className="grid gap-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            adicionar();
          }}
        >
          <CampoSelect id="ganho-tipo" label="Tipo" value={tipo} onChange={(v) => setTipo(v as TipoEntrada)}>
            {OPCOES.map((opcao) => (
              <option key={opcao.id} value={opcao.id}>
                {opcao.rotulo}
              </option>
            ))}
          </CampoSelect>
          <CampoTexto
            id="ganho-nome"
            label="Descrição"
            value={nome}
            placeholder="Ex.: Bico de sábado, venda do monitor"
            onChange={setNome}
          />
          <CampoMoeda id="ganho-novo-valor" label="Valor" value={valor} onChange={setValor} autoFocus />
          {erro ? (
            <p className="text-sm text-outflow" role="alert">
              {erro}
            </p>
          ) : null}
          <button type="submit" className="btn-primary" disabled={pendente}>
            {pendente ? "Salvando…" : "Registrar entrada"}
          </button>
        </form>
      </Modal>
    </article>
  );
}
