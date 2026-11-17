"use client";

import { BotaoFlutuante } from "@/components/botao-flutuante";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { salvarMesAction } from "@/app/actions/mes";
import { CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { Modal } from "@/components/modal";
import type { FonteRendaDTO } from "@/lib/application/renda-mapper";
import type { ItemDTO, MesDTO } from "@/lib/application/mes-mapper";
import { avancarCompetencia, formatarCompetencia } from "@/lib/domain/financeiro/competencia";
import { NOTAS_TIPO_RENDA, type TipoRenda } from "@/lib/domain/financeiro/renda";
import type { PapelExtra } from "@/lib/domain/financeiro/tipos";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  competencia: string;
  mesInicial: MesDTO;
  sobrou: number;
  gasto: number;
  fontes: FonteRendaDTO[];
};

type TipoEntrada = "SALARIO" | "BICO" | "VENDA" | PapelExtra;

const OPCOES: { id: TipoEntrada; rotulo: string; nota: string }[] = [
  { id: "SALARIO", rotulo: "Salário", nota: NOTAS_TIPO_RENDA.EMPREGO },
  { id: "BICO", rotulo: "Bico", nota: NOTAS_TIPO_RENDA.BICO },
  { id: "VENDA", rotulo: "Venda", nota: NOTAS_TIPO_RENDA.VENDA },
  { id: "VALE_TRANSPORTE", rotulo: "Vale-transporte", nota: NOTAS_TIPO_RENDA.VALE_TRANSPORTE },
  { id: "VALE_ALIMENTACAO", rotulo: "Vale-alimentação", nota: NOTAS_TIPO_RENDA.VALE_ALIMENTACAO },
  { id: "PROVENTO_FUNDO", rotulo: "Rendimento do fundo imobiliário", nota: NOTAS_TIPO_RENDA.RENDIMENTO },
  { id: "PROVENTO_POUPANCA", rotulo: "Rendimento da poupança", nota: NOTAS_TIPO_RENDA.RENDIMENTO },
  { id: "OUTRO", rotulo: "Outro extra", nota: "Entra no mês, sem regra especial de teto." },
];

const PLACEHOLDER: Partial<Record<TipoEntrada, string>> = {
  SALARIO: "Ex.: Projeto, HUJB, salário",
  BICO: "Ex.: Plantão de sábado, freela",
  VENDA: "Ex.: Venda do monitor, marketplace",
  VALE_TRANSPORTE: "Ex.: Vale-transporte",
  VALE_ALIMENTACAO: "Ex.: Vale-alimentação",
  PROVENTO_FUNDO: "Ex.: Provento fundo",
  PROVENTO_POUPANCA: "Ex.: Rendimento da poupança",
  OUTRO: "Ex.: Reembolso, devolução",
};

const soma = (itens: ItemDTO[]) => itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

const tipoDaFonte = (fontes: FonteRendaDTO[], fonteRendaId?: string | null): TipoRenda | null => {
  if (!fonteRendaId) return null;
  return fontes.find((fonte) => fonte.id === fonteRendaId)?.tipo ?? null;
};

const ehPontual = (fontes: FonteRendaDTO[], item: ItemDTO) => {
  const tipo = tipoDaFonte(fontes, item.fonteRendaId);
  return tipo === "BICO" || tipo === "VENDA";
};

export function PainelGanhos({ competencia, mesInicial, sobrou, gasto, fontes }: Props) {
  const router = useRouter();
  const [mes, setMes] = useState(mesInicial);
  const [mesRecebido, setMesRecebido] = useState(mesInicial);
  if (mesRecebido !== mesInicial) {
    setMesRecebido(mesInicial);
    setMes(mesInicial);
  }
  const [status, setStatus] = useState("");
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoEntrada>("SALARIO");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState(0);
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();

  useEffect(() => setMes(mesInicial), [mesInicial]);

  const dinheiro = mes.itens.map((item, indice) => ({ item, indice })).filter(({ item }) => item.tipo === "SALDO");
  const salario = dinheiro.filter(({ item }) => !ehPontual(fontes, item));
  const pontual = dinheiro.filter(({ item }) => ehPontual(fontes, item));
  const extras = mes.itens.map((item, indice) => ({ item, indice })).filter(({ item }) => item.tipo === "EXTRA");
  const totalSalario = soma(salario.map(({ item }) => item));
  const totalPontual = soma(pontual.map(({ item }) => item));
  const totalExtras = soma(extras.map(({ item }) => item));
  const ganhou = totalSalario + totalPontual + totalExtras;
  const fechado = mes.fechado;
  const notaTipo = OPCOES.find((opcao) => opcao.id === tipo)?.nota ?? "";

  const fonteIdPara = (entrada: TipoEntrada): string | null => {
    if (entrada === "BICO") return fontes.find((f) => f.tipo === "BICO")?.id ?? null;
    if (entrada === "VENDA") return fontes.find((f) => f.tipo === "VENDA")?.id ?? null;
    if (entrada === "SALARIO") return fontes.find((f) => f.tipo === "EMPREGO")?.id ?? null;
    return null;
  };

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
    const rotulo =
      nome.trim() || OPCOES.find((opcao) => opcao.id === tipo)?.rotulo || "";
    if (!rotulo) return setErro("Informe de onde veio o dinheiro.");
    if (!(valor > 0)) return setErro("Informe o valor da entrada.");
    const ordem = mes.itens.reduce((acc, item) => Math.max(acc, item.ordem), -1) + 1;
    const ehDinheiro = tipo === "SALARIO" || tipo === "BICO" || tipo === "VENDA";
    const novo: ItemDTO = ehDinheiro
      ? {
          tipo: "SALDO",
          nome: rotulo,
          valor,
          ordem,
          pago: false,
          fonteRendaId: fonteIdPara(tipo),
        }
      : { tipo: "EXTRA", nome: rotulo, valor, papel: tipo, ordem, pago: false };
    const avisoTeto =
      tipo === "BICO" || tipo === "VENDA"
        ? " (não sobe o teto do cartão)"
        : tipo === "SALARIO"
          ? " (entra no teto do cartão)"
          : "";
    gravar({ ...mes, itens: [...mes.itens, novo] }, `Entrada de ${formatarMoeda(valor)} registrada${avisoTeto}.`, () => {
      setAberto(false);
      setNome("");
      setValor(0);
      setTipo("SALARIO");
    });
  };

  const detalhePontual = (item: ItemDTO) => {
    const tipoFonte = tipoDaFonte(fontes, item.fonteRendaId);
    if (tipoFonte === "VENDA") return "Venda · não sobe teto";
    if (tipoFonte === "BICO") return "Bico · não sobe teto";
    return null;
  };

  const lista = (
    titulo: string,
    nota: string,
    linhas: typeof dinheiro,
    total: number,
    vazio: string,
    comDetalhe = false,
  ) => (
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
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.nome || "Sem nome"}</span>
                  {comDetalhe && detalhePontual(item) ? (
                    <span className="block text-xs text-mute">{detalhePontual(item)}</span>
                  ) : null}
                </span>
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
              : "Separe salário, bico e venda: só o salário sobe o teto do cartão."}
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
          <p className="text-xs text-mute">Salário + bico/venda + vales</p>
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
          "Salário",
          "Emprego e renda que se repete. Entra no teto do cartão.",
          salario,
          totalSalario,
          "Nenhum salário neste mês.",
        )}
        {lista(
          "Bico e venda",
          "Dinheiro pontual. Entra no caixa e na poupança, mas não sobe o teto do cartão.",
          pontual,
          totalPontual,
          "Nenhum bico ou venda neste mês.",
          true,
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
        descricao="Escolha o tipo: salário sobe o teto; bico e venda entram no caixa sem liberar mais cartão."
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
          {notaTipo ? <p className="text-sm text-mute">{notaTipo}</p> : null}
          <CampoTexto
            id="ganho-nome"
            label="Descrição"
            value={nome}
            placeholder={PLACEHOLDER[tipo] ?? "Ex.: de onde veio"}
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
