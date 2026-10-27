"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { LinhaMeta } from "@/lib/application/dashboard-visao";
import { ehAPagar, progressoPagamento } from "@/lib/application/checklist";
import type { ItemDTO, MesDTO } from "@/lib/application/mes-mapper";
import type { ParcelaCartao } from "@/lib/domain/financeiro/cartao";
import type { ResultadoMes } from "@/lib/domain/financeiro/tipos";
import { formatarMoeda } from "@/lib/formatacao";

type CampoNota = "feiraReal" | "gasolinaReal" | "cartaoReal" | "fundoReal" | "alttabReal" | "poupancaReal";

type SuperficieNota = "inicio" | "investimentos";

type Editor =
  | { tipo: "conta"; indice: number }
  | { tipo: "entrada"; indice: number }
  | { tipo: "campo"; campo: CampoNota }
  | { tipo: "nova" }
  | { tipo: "bico" };

type IdEtapa = "entrou" | "contas" | "cartao" | "poupanca" | "fundo" | "meta" | "alttab";

type Props = {
  mes: MesDTO;
  faturaCartao?: number;
  parcelasCartao?: ParcelaCartao[];
  recorrentesCartao?: { nome: string; valor: number }[];
  totais?: ResultadoMes;
  metas?: LinhaMeta[];
  superficie?: SuperficieNota;
  onToggle: (indice: number, pago: boolean) => void;
  onSalvarConta: (indice: number, valor: number, pago: boolean) => void;
  onSalvarItem: (indice: number, valor: number) => void;
  onSalvarCampo: (campo: CampoNota, valor: number) => void;
  onNovaConta?: (nome: string, valor: number, pago: boolean) => void;
  onNovoBico?: (nome: string, valor: number) => void;
  somenteLeitura?: boolean;
};

const CAMPOS: Record<CampoNota, { nome: string; hint: (totais?: ResultadoMes) => string | undefined }> = {
  feiraReal: {
    nome: "Feira",
    hint: () => "O que saiu na feira neste mês.",
  },
  gasolinaReal: {
    nome: "Gasolina",
    hint: () => "O que saiu de combustível neste mês.",
  },
  cartaoReal: {
    nome: "Avulso no cartão",
    hint: (totais) => {
      const cartao = totais?.despesasVariaveis.cartao;
      if (!cartao) return "O que não é gasto fixo nem parcela. O teto é o que sobrou depois das contas.";
      if (cartao.estoura) {
        return `A fatura já passa do teto ${formatarMoeda(cartao.teto)}. Não gastem mais neste cartão.`;
      }
      return `Ainda cabe ${formatarMoeda(cartao.cabe)} neste mês. Teto: ${formatarMoeda(cartao.teto)} depois das contas.`;
    },
  },
  fundoReal: {
    nome: "Fundo imobiliário",
    hint: (totais) => textoPlanoFundo(totais),
  },
  alttabReal: {
    nome: "Alttab",
    hint: (totais) =>
      totais?.rendimento.apertado
        ? "Mês apertado: o depósito na empresa pode esperar."
        : "Depósito na empresa. Geralmente R$ 100,00.",
  },
  poupancaReal: {
    nome: "Poupança",
    hint: (totais) =>
      totais && totais.investimentos.poupanca.sugestao > 0.005
        ? `10% das entradas: ${formatarMoeda(totais.investimentos.poupanca.sugestao)}. Se o mês apertar, usem nas contas.`
        : "10% das entradas. Se o mês apertar, usem nas contas.",
  },
};

export function NotaMes({
  mes,
  faturaCartao = 0,
  parcelasCartao = [],
  recorrentesCartao = [],
  totais,
  metas = [],
  superficie = "inicio",
  onToggle,
  onSalvarConta,
  onSalvarItem,
  onSalvarCampo,
  onNovaConta,
  onNovoBico,
  somenteLeitura = false,
}: Props) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const entradas = mes.itens
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => item.tipo === "SALDO" || item.tipo === "EXTRA");
  const saldos = entradas.filter(({ item }) => item.tipo === "SALDO");
  const extras = entradas.filter(({ item }) => item.tipo === "EXTRA");
  const vales = extras.filter(({ item }) => ehVale(item));
  const rendimentos = extras.filter(({ item }) => ehProvento(item));
  const outrosExtra = extras.filter(({ item }) => !ehVale(item) && !ehProvento(item));
  const dividasMeta = metas.filter((meta) => meta.id.startsWith("emprestimo-"));
  const contas = mes.itens
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => ehAPagar(item.tipo));
  const pagamento = progressoPagamento(mes.itens);
  const planoCartao = totais?.despesasVariaveis.cartao;
  const cartaoTotal = planoCartao?.fatura ?? mes.cartaoReal + faturaCartao;
  const poupancaSugestao = totais?.investimentos.poupanca.sugestao ?? 0;
  const poupancaValor = mes.poupancaEditado ? mes.poupancaReal : poupancaSugestao;
  const paraMeta = totais?.distribuicao.metaFinal ?? 0;
  const fundo = totais?.investimentos.fundo;
  const agora = etapaAtual(mes, pagamento, totais, superficie);
  const passo = textoProximoPasso(mes, pagamento, totais, superficie);
  const abrir = (proximo: Editor) => {
    if (somenteLeitura) return;
    setEditor(proximo);
  };

  return (
    <section className="nota" aria-labelledby="rito-titulo">
      <header className="nota-cabeca">
        <div className="min-w-0">
          <h2 id="rito-titulo" className="titulo-secao">
            {superficie === "investimentos" ? "Aportes deste mês" : "Neste mês"}
          </h2>
          {passo ? <p className="nota-passo mt-2">{passo}</p> : null}
        </div>
      </header>

      {superficie === "investimentos" ? (
        <div className="rito-corpo is-investimentos">
          <Etapa
            id="rito-poupanca"
            numero={1}
            titulo="Poupança"
            detalhe="10% das entradas"
            atual={agora === "poupanca"}
          >
            <ul>
              <LinhaBotao
                nome="Poupança"
                valor={poupancaValor}
                detalhe={!mes.poupancaEditado && poupancaSugestao > 0.005 ? "sugestão" : undefined}
                onClick={() => abrir({ tipo: "campo", campo: "poupancaReal" })}
                somenteLeitura={somenteLeitura}
              />
            </ul>
          </Etapa>

          <Etapa
            id="rito-fundo"
            numero={2}
            titulo="Fundo imobiliário"
            detalhe={
              totais?.rendimento.apertado
                ? "Mês apertado: podem pular"
                : fundo?.atingiuAlvo
                  ? "Já rende R$ 100 no mês"
                  : "R$ 50 + rendimento"
            }
            atual={agora === "fundo"}
          >
            <p className="rito-nota">{textoPlanoFundo(totais)}</p>
            <ul>
              <LinhaBotao
                nome="Fundo imobiliário"
                valor={mes.fundoReal}
                detalhe={
                  mes.fundoReal < 0.005 && fundo && fundo.sugestao > 0.005
                    ? `sugestão ${formatarMoeda(fundo.sugestao)}`
                    : undefined
                }
                onClick={() => abrir({ tipo: "campo", campo: "fundoReal" })}
                somenteLeitura={somenteLeitura}
              />
              {fundo && fundo.proximo > 0.005 ? (
                <LinhaTexto nome="Próximo investimento" valor={fundo.proximo} detalhe="metade do rendimento" />
              ) : null}
            </ul>
          </Etapa>

          <Etapa
            id="rito-meta"
            numero={3}
            titulo="Meta"
            detalhe={paraMeta > 0.005 ? `Sobra ${formatarMoeda(paraMeta)}` : "Ainda não sobrou"}
            atual={agora === "meta"}
          >
            <p className="rito-nota">
              {paraMeta > 0.005
                ? `O sistema manda ${formatarMoeda(paraMeta)} para a meta.`
                : "O que sobrar depois das contas, do cartão e dos aportes vai para a meta."}
            </p>
            {dividasMeta.length > 0 ? (
              <ul>
                {dividasMeta.map((meta) => (
                  <LinhaLink
                    key={meta.id}
                    nome={meta.rotulo}
                    valor={meta.progresso.falta}
                    href={meta.href}
                  />
                ))}
              </ul>
            ) : null}
          </Etapa>

          <Etapa
            id="rito-alttab"
            numero={4}
            titulo="Alttab"
            detalhe={totais?.rendimento.apertado ? "Mês apertado: podem pular" : "Geralmente R$ 100,00"}
            atual={agora === "alttab"}
          >
            <ul>
              <LinhaBotao
                nome="Depósito na empresa"
                valor={mes.alttabReal}
                onClick={() => abrir({ tipo: "campo", campo: "alttabReal" })}
                somenteLeitura={somenteLeitura}
              />
            </ul>
          </Etapa>
        </div>
      ) : (
        <div className="rito-corpo is-inicio">
          <Etapa
            id="rito-entrou"
            numero={1}
            titulo="Entradas"
            detalhe={totais && totais.resumo.ganhou > 0.005 ? formatarMoeda(totais.resumo.ganhou) : "Ainda sem valor"}
            atual={agora === "entrou"}
            acao={
              somenteLeitura || !onNovoBico ? null : (
                <button className="btn shrink-0 text-sm" type="button" onClick={() => abrir({ tipo: "bico" })}>
                  Novo bico
                </button>
              )
            }
          >
            {saldos.length === 0 && extras.length === 0 ? (
              <p className="rito-vazio">
                Cadastrem as fontes em{" "}
                <Link className="underline" href="/entradas">
                  Cadastros
                </Link>{" "}
                e lancem o valor aqui quando o dinheiro chegar.
              </p>
            ) : (
              <>
                {saldos.length > 0 ? (
                  <ul>
                    {saldos.map(({ item, indice }) => (
                      <LinhaBotao
                        key={`${item.tipo}-${indice}-${item.nome}`}
                        nome={item.nome || "Sem nome"}
                        valor={item.valor}
                        onClick={() => abrir({ tipo: "entrada", indice })}
                        somenteLeitura={somenteLeitura}
                      />
                    ))}
                  </ul>
                ) : null}
                {vales.length > 0 || outrosExtra.length > 0 ? (
                  <div className="rito-sub">
                    <p className="rito-sub-titulo">Vales</p>
                    <ul>
                      {[...vales, ...outrosExtra].map(({ item, indice }) => (
                        <LinhaBotao
                          key={`${item.tipo}-${indice}-${item.nome}`}
                          nome={item.nome || "Sem nome"}
                          valor={item.valor}
                          detalhe={rotuloEntrada(item)}
                          onClick={() => abrir({ tipo: "entrada", indice })}
                          somenteLeitura={somenteLeitura}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}
                {rendimentos.length > 0 ? (
                  <div className="rito-sub">
                    <p className="rito-sub-titulo">Rendimento das contas e da meta</p>
                    <ul>
                      {rendimentos.map(({ item, indice }) => (
                        <LinhaBotao
                          key={`${item.tipo}-${indice}-${item.nome}`}
                          nome={item.nome || "Sem nome"}
                          valor={item.valor}
                          onClick={() => abrir({ tipo: "entrada", indice })}
                          somenteLeitura={somenteLeitura}
                        />
                      ))}
                    </ul>
                    <p className="rito-nota">
                      {totais && totais.rendimento.total >= 0.005
                        ? totais.rendimento.apertado
                          ? `${formatarMoeda(totais.rendimento.paraContas)} nas contas. ${formatarMoeda(totais.rendimento.reinvestido)} reinvestido.`
                          : `Reinvestido ${formatarMoeda(totais.rendimento.reinvestido)}. Se o mês apertar, o sistema usa nas contas.`
                        : "Lancem o valor. Se o mês apertar, o sistema usa nas contas; senão, reinveste."}
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </Etapa>

          <Etapa
            id="rito-contas"
            numero={2}
            titulo="Contas"
            detalhe={
              pagamento.total === 0
                ? "Nenhuma ainda"
                : `${pagamento.pagas} de ${pagamento.total} ${pagamento.total === 1 ? "paga" : "pagas"}`
            }
            atual={agora === "contas"}
            acao={
              somenteLeitura || !onNovaConta ? null : (
                <button className="btn shrink-0 text-sm" type="button" onClick={() => abrir({ tipo: "nova" })}>
                  Nova conta
                </button>
              )
            }
          >
            {contas.length === 0 ? (
              <p className="rito-vazio">
                Contas que se repetem se cadastram em{" "}
                <Link className="underline" href="/gastos">
                  Cadastros
                </Link>
                . Extra só deste mês: Nova conta.
              </p>
            ) : (
              <ul>
                {contas.map(({ item, indice }) => (
                  <LinhaConta
                    key={`${item.tipo}-${indice}-${item.nome}`}
                    item={item}
                    indice={indice}
                    onToggle={onToggle}
                    onAbrir={() => abrir({ tipo: "conta", indice })}
                    somenteLeitura={somenteLeitura}
                  />
                ))}
              </ul>
            )}
            <div className="rito-sub" id="rito-feira">
              <p className="rito-sub-titulo">Feira e gasolina</p>
              <ul>
                <LinhaBotao
                  nome="Feira"
                  valor={mes.feiraReal}
                  onClick={() => abrir({ tipo: "campo", campo: "feiraReal" })}
                  somenteLeitura={somenteLeitura}
                />
                <LinhaBotao
                  nome="Gasolina"
                  valor={mes.gasolinaReal}
                  onClick={() => abrir({ tipo: "campo", campo: "gasolinaReal" })}
                  somenteLeitura={somenteLeitura}
                />
              </ul>
            </div>
          </Etapa>

          <Etapa
            id="rito-cartao"
            numero={3}
            titulo="Cartão"
            detalhe={cartaoTotal > 0.005 ? formatarMoeda(cartaoTotal) : "Sem fatura ainda"}
            atual={agora === "cartao"}
          >
            {planoCartao && planoCartao.teto > 0.005 ? (
              <p className={`mb-3 text-sm ${planoCartao.estoura ? "rito-aperto" : "text-mute"}`}>
                {planoCartao.estoura
                  ? `Fatura ${formatarMoeda(planoCartao.fatura)} passa do teto ${formatarMoeda(planoCartao.teto)} (o que sobrou depois das contas).`
                  : `Depois das contas sobra ${formatarMoeda(planoCartao.teto)}. Ainda cabe ${formatarMoeda(planoCartao.cabe)} neste cartão.`}
              </p>
            ) : null}
            <ul>
              {recorrentesCartao.map((item) => (
                <LinhaLink
                  key={`fixo-${item.nome}`}
                  nome={`${item.nome} · fixo`}
                  valor={item.valor}
                  href="/cartao?novo=fixo"
                />
              ))}
              {parcelasCartao.map((parcela) => (
                <LinhaLink
                  key={`${parcela.nome}-${parcela.atual}`}
                  nome={`${parcela.nome} ${parcela.atual}/${parcela.total}`}
                  valor={parcela.valor}
                  href="/cartao"
                />
              ))}
              <LinhaBotao
                nome={recorrentesCartao.length > 0 || parcelasCartao.length > 0 ? "Avulso no cartão" : "Fatura"}
                valor={mes.cartaoReal}
                onClick={() => abrir({ tipo: "campo", campo: "cartaoReal" })}
                somenteLeitura={somenteLeitura}
              />
            </ul>
          </Etapa>
        </div>
      )}

      {editor?.tipo === "conta" ? (
        <ModalValorConta
          item={mes.itens[editor.indice]}
          onClose={() => setEditor(null)}
          onSalvar={(valor, pago) => {
            onSalvarConta(editor.indice, valor, pago);
            setEditor(null);
          }}
        />
      ) : null}

      {editor?.tipo === "entrada" ? (
        <ModalValorEntrada
          item={mes.itens[editor.indice]}
          onClose={() => setEditor(null)}
          onSalvar={(valor) => {
            onSalvarItem(editor.indice, valor);
            setEditor(null);
          }}
        />
      ) : null}

      {editor?.tipo === "campo" ? (
        <ModalValorCampo
          campo={editor.campo}
          valor={valorInicialCampo(editor.campo, mes, totais)}
          totais={totais}
          onClose={() => setEditor(null)}
          onSalvar={(valor) => {
            onSalvarCampo(editor.campo, valor);
            setEditor(null);
          }}
        />
      ) : null}

      {editor?.tipo === "nova" && onNovaConta ? (
        <ModalNovaConta
          onClose={() => setEditor(null)}
          onSalvar={(nome, valor, pago) => {
            onNovaConta(nome, valor, pago);
            setEditor(null);
          }}
        />
      ) : null}

      {editor?.tipo === "bico" && onNovoBico ? (
        <ModalNovoBico
          onClose={() => setEditor(null)}
          onSalvar={(nome, valor) => {
            onNovoBico(nome, valor);
            setEditor(null);
          }}
        />
      ) : null}
    </section>
  );
}

function etapaAtual(
  mes: MesDTO,
  pagamento: { total: number; pagas: number },
  totais?: ResultadoMes,
  superficie: SuperficieNota = "inicio",
): IdEtapa | null {
  if (superficie === "investimentos") {
    if (!totais) return "poupanca";
    const falta = totais.prioridade.find((etapa) => etapa.status === "falta");
    if (falta?.id === "poupanca") return "poupanca";
    if (falta?.id === "investimento") return mes.fundoReal < 0.005 ? "fundo" : "alttab";
    if (falta?.id === "reposicao") return "meta";
    return "meta";
  }
  if (!totais) return "entrou";
  if (totais.resumo.ganhou < 0.005) return "entrou";
  if (pagamento.total > 0 && pagamento.pagas < pagamento.total) return "contas";
  const falta = totais.prioridade.find((etapa) => etapa.status === "falta");
  if (falta?.id === "cartao") return "cartao";
  return null;
}

function textoProximoPasso(
  mes: MesDTO,
  pagamento: { total: number; pagas: number },
  totais?: ResultadoMes,
  superficie: SuperficieNota = "inicio",
) {
  const agora = etapaAtual(mes, pagamento, totais, superficie);
  if (superficie === "investimentos") {
    if (agora === "poupanca") return "10% das entradas na poupança, se o mês não estiver apertado.";
    if (agora === "fundo") {
      return totais?.rendimento.apertado
        ? "Mês apertado: o fundo pode esperar."
        : textoPlanoFundo(totais);
    }
    if (agora === "alttab") {
      return totais?.rendimento.apertado
        ? "Mês apertado: o depósito na empresa pode esperar."
        : "Depósito na Alttab, se o mês não estiver apertado.";
    }
    if (totais && totais.distribuicao.reposicaoMeta > 0.005) {
      return `Devolver ${formatarMoeda(totais.distribuicao.reposicaoMeta)} à meta.`;
    }
    if (totais && totais.distribuicao.metaFinal > 0.005) {
      return `Sobra ${formatarMoeda(totais.distribuicao.metaFinal)} para a meta.`;
    }
    return "O que sobrar depois das contas e dos aportes vai para a meta.";
  }
  if (agora === "entrou") return "Primeiro o que entrou. Abram a linha quando o dinheiro chegar.";
  if (agora === "contas") {
    return pagamento.pagas === 0
      ? "Agora as contas. Abram a linha para registrar o valor."
      : `Ainda faltam ${pagamento.total - pagamento.pagas} ${
          pagamento.total - pagamento.pagas === 1 ? "conta" : "contas"
        }. Depois, o cartão.`;
  }
  if (agora === "cartao") {
    const cartao = totais?.despesasVariaveis.cartao;
    if (cartao?.estoura) {
      return `A fatura passa do que sobrou depois das contas (${formatarMoeda(cartao.teto)}).`;
    }
    if (cartao && cartao.teto > 0.005) {
      return `Contas pagas. O teto do cartão é ${formatarMoeda(cartao.teto)}. Ainda cabe ${formatarMoeda(cartao.cabe)}.`;
    }
    return "Contas pagas. Agora o cartão.";
  }
  return "Entradas, contas e cartão. Poupança, fundo, meta e Alttab ficam em Investimentos.";
}

function textoPlanoFundo(totais?: ResultadoMes) {
  if (!totais) {
    return "Enquanto o fundo não render R$ 100,00 por mês: aplicam R$ 50,00 + o rendimento inteiro neste fundo.";
  }
  const fundo = totais.investimentos.fundo;
  if (totais.rendimento.apertado) {
    return "Mês apertado: não precisa aportar. Rendimento foi para as contas.";
  }
  if (fundo.atingiuAlvo) {
    return `O fundo rendeu ${formatarMoeda(totais.proventoFundo)} neste mês. Continuam os R$ 50,00 + metade do rendimento neste fundo (${formatarMoeda(fundo.ajuste)}). A outra metade (${formatarMoeda(fundo.proximo)}) vai para o próximo investimento.`;
  }
  return `Enquanto o fundo não render R$ 100,00 por mês: R$ 50,00 + o rendimento inteiro. Sugestão deste mês: ${formatarMoeda(fundo.sugestao)}.`;
}

function valorInicialCampo(campo: CampoNota, mes: MesDTO, totais?: ResultadoMes) {
  if (campo === "poupancaReal" && !mes.poupancaEditado) {
    return totais?.investimentos.poupanca.sugestao ?? mes.poupancaReal;
  }
  return mes[campo];
}

function ehVale(item: ItemDTO) {
  return item.papel === "VALE_ALIMENTACAO" || item.papel === "VALE_TRANSPORTE";
}

function ehProvento(item: ItemDTO) {
  return item.papel === "PROVENTO_FUNDO" || item.papel === "PROVENTO_POUPANCA";
}

function rotuloEntrada(item: ItemDTO) {
  if (item.papel === "VALE_ALIMENTACAO") return "VA";
  if (item.papel === "VALE_TRANSPORTE") return "VT";
  return undefined;
}

function Etapa({
  id,
  numero,
  titulo,
  detalhe,
  atual = false,
  acao,
  children,
}: {
  id: string;
  numero?: number;
  titulo: string;
  detalhe?: string;
  atual?: boolean;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`rito-etapa ${atual ? "is-agora" : ""}`} aria-labelledby={`${id}-titulo`}>
      <header className="rito-etapa-cabeca">
        <div className="min-w-0">
          <h3 id={`${id}-titulo`} className="rito-etapa-titulo">
            {numero ? <span className="rito-num">{numero}</span> : null}
            {titulo}
          </h3>
          {detalhe ? <p className="rito-etapa-detalhe">{detalhe}</p> : null}
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}

function LinhaConta({
  item,
  indice,
  onToggle,
  onAbrir,
  somenteLeitura,
}: {
  item: ItemDTO;
  indice: number;
  onToggle: (indice: number, pago: boolean) => void;
  onAbrir: () => void;
  somenteLeitura: boolean;
}) {
  const id = `nota-pago-${item.tipo}-${indice}`;
  const zerado = Math.abs(item.valor) < 0.005;
  return (
    <li>
      <div className={`nota-linha ${item.pago ? "is-paga" : ""}`}>
        <input
          id={id}
          className="checkbox-pago shrink-0"
          type="checkbox"
          name={id}
          checked={item.pago}
          disabled={somenteLeitura}
          aria-label={`${item.nome || "Conta"} paga`}
          onChange={(evento) => onToggle(indice, evento.target.checked)}
        />
        <button
          type="button"
          className={`nota-abrir ${somenteLeitura ? "" : "is-clicavel"}`}
          onClick={onAbrir}
          disabled={somenteLeitura}
        >
          <span className="nota-nome">
            {item.nome || "Sem nome"}
            {item.tipo === "EXTRA_MES" ? <span className="nota-tag">extra</span> : null}
            {item.tipo === "ANUAL" ? <span className="nota-tag">anual</span> : null}
          </span>
          <span className={`nota-valor money ${zerado ? "is-vazio" : ""}`}>
            {zerado ? "—" : formatarMoeda(item.valor)}
          </span>
        </button>
      </div>
    </li>
  );
}

function LinhaBotao({
  nome,
  valor,
  detalhe,
  onClick,
  somenteLeitura,
}: {
  nome: string;
  valor: number;
  detalhe?: string;
  onClick: () => void;
  somenteLeitura: boolean;
}) {
  const vazio = Math.abs(valor) < 0.005;
  return (
    <li>
      <button
        type="button"
        className={`nota-linha ${somenteLeitura ? "" : "is-clicavel"}`}
        onClick={onClick}
        disabled={somenteLeitura}
      >
        <span className="nota-marca" aria-hidden="true" />
        <span className="nota-nome">
          {nome}
          {detalhe ? <span className="nota-tag">{detalhe}</span> : null}
        </span>
        <span className={`nota-valor money ${vazio ? "is-vazio" : ""}`}>
          {vazio ? "—" : formatarMoeda(valor)}
        </span>
      </button>
    </li>
  );
}

function LinhaLink({ nome, valor, href }: { nome: string; valor: number; href: string }) {
  const vazio = Math.abs(valor) < 0.005;
  return (
    <li>
      <Link href={href} className="nota-linha is-clicavel">
        <span className="nota-marca" aria-hidden="true" />
        <span className="nota-nome">{nome}</span>
        <span className={`nota-valor money ${vazio ? "is-vazio" : ""}`}>
          {vazio ? "—" : formatarMoeda(valor)}
        </span>
      </Link>
    </li>
  );
}

function LinhaTexto({ nome, valor, detalhe }: { nome: string; valor: number; detalhe?: string }) {
  const vazio = Math.abs(valor) < 0.005;
  return (
    <li>
      <div className="nota-linha">
        <span className="nota-marca" aria-hidden="true" />
        <span className="nota-nome">
          {nome}
          {detalhe ? <span className="nota-tag">{detalhe}</span> : null}
        </span>
        <span className={`nota-valor money ${vazio ? "is-vazio" : ""}`}>
          {vazio ? "—" : formatarMoeda(valor)}
        </span>
      </div>
    </li>
  );
}

function ModalValorConta({
  item,
  onClose,
  onSalvar,
}: {
  item: ItemDTO;
  onClose: () => void;
  onSalvar: (valor: number, pago: boolean) => void;
}) {
  const [valor, setValor] = useState(item.valor);
  const [pago, setPago] = useState(item.pago || Math.abs(item.valor) < 0.005);
  return (
    <Modal
      aberto
      titulo={item.nome || "Conta"}
      descricao="O valor da conta que chegou. Marquem se já pagaram — o sistema ajusta o que sobra."
      onClose={onClose}
    >
      <FormularioModal
        onSubmit={() => onSalvar(valor, pago)}
        acoes={<AcoesCadastro pendente={false} onVoltar={onClose} salvar="Registrar" />}
      >
        <CampoMoeda id="nota-valor-conta" label="Valor" value={valor} onChange={setValor} autoFocus />
        <label className="nota-pago-campo" htmlFor="nota-modal-pago">
          <input
            id="nota-modal-pago"
            className="checkbox-pago shrink-0"
            type="checkbox"
            checked={pago}
            onChange={(evento) => setPago(evento.target.checked)}
          />
          <span>Já pagamos</span>
        </label>
      </FormularioModal>
    </Modal>
  );
}

function ModalValorEntrada({
  item,
  onClose,
  onSalvar,
}: {
  item: ItemDTO;
  onClose: () => void;
  onSalvar: (valor: number) => void;
}) {
  const [valor, setValor] = useState(item.valor);
  return (
    <Modal
      aberto
      titulo={item.nome || "Entrada"}
      descricao={
        ehProvento(item)
          ? "Rendimento deste mês. Se o mês apertar, o sistema usa nas contas; senão, reinveste."
          : "O que entrou nesta fonte neste mês."
      }
      onClose={onClose}
    >
      <FormularioModal
        onSubmit={() => onSalvar(valor)}
        acoes={<AcoesCadastro pendente={false} onVoltar={onClose} salvar="Registrar" />}
      >
        <CampoMoeda id="nota-valor-entrada" label="Valor" value={valor} onChange={setValor} autoFocus />
      </FormularioModal>
    </Modal>
  );
}

function ModalValorCampo({
  campo,
  valor: inicial,
  totais,
  onClose,
  onSalvar,
}: {
  campo: CampoNota;
  valor: number;
  totais?: ResultadoMes;
  onClose: () => void;
  onSalvar: (valor: number) => void;
}) {
  const [valor, setValor] = useState(inicial);
  const meta = CAMPOS[campo];
  return (
    <Modal aberto titulo={meta.nome} descricao={meta.hint(totais)} onClose={onClose}>
      <FormularioModal
        onSubmit={() => onSalvar(valor)}
        acoes={<AcoesCadastro pendente={false} onVoltar={onClose} salvar="Registrar" />}
      >
        <CampoMoeda id={`nota-valor-${campo}`} label="Valor" value={valor} onChange={setValor} autoFocus />
      </FormularioModal>
    </Modal>
  );
}

function ModalNovaConta({
  onClose,
  onSalvar,
}: {
  onClose: () => void;
  onSalvar: (nome: string, valor: number, pago: boolean) => void;
}) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState(0);
  const [pago, setPago] = useState(true);
  const [erro, setErro] = useState("");
  return (
    <Modal
      aberto
      titulo="Nova conta"
      descricao="Entra só neste mês: Magazine, IPTV, uma extra. Conta que se repete se cadastra em Cadastros."
      onClose={onClose}
    >
      <FormularioModal
        erro={erro}
        onSubmit={() => {
          if (!nome.trim()) {
            setErro("Dê um nome para a conta.");
            return;
          }
          onSalvar(nome, valor, pago);
        }}
        acoes={<AcoesCadastro pendente={false} onVoltar={onClose} salvar="Registrar" />}
      >
        <CampoTexto
          id="nota-nova-nome"
          label="Nome"
          value={nome}
          onChange={(proximo) => {
            setNome(proximo);
            setErro("");
          }}
          placeholder="Ex.: IPTV, Magazine Luiza…"
          autoFocus
        />
        <CampoMoeda id="nota-nova-valor" label="Valor" value={valor} onChange={setValor} />
        <label className="nota-pago-campo" htmlFor="nota-nova-pago">
          <input
            id="nota-nova-pago"
            className="checkbox-pago shrink-0"
            type="checkbox"
            checked={pago}
            onChange={(evento) => setPago(evento.target.checked)}
          />
          <span>Já pagamos</span>
        </label>
      </FormularioModal>
    </Modal>
  );
}

function ModalNovoBico({
  onClose,
  onSalvar,
}: {
  onClose: () => void;
  onSalvar: (nome: string, valor: number) => void;
}) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState(0);
  const [erro, setErro] = useState("");
  return (
    <Modal
      aberto
      titulo="Novo bico"
      descricao="Entra no caixa deste mês. O sistema manda o que sobrar para a meta, ou vocês usam nas contas."
      onClose={onClose}
    >
      <FormularioModal
        erro={erro}
        onSubmit={() => {
          if (!nome.trim()) {
            setErro("Dê um nome para o bico.");
            return;
          }
          onSalvar(nome, valor);
        }}
        acoes={<AcoesCadastro pendente={false} onVoltar={onClose} salvar="Registrar" />}
      >
        <CampoTexto
          id="nota-bico-nome"
          label="Nome"
          value={nome}
          onChange={(proximo) => {
            setNome(proximo);
            setErro("");
          }}
          placeholder="Ex.: Freelance, diária…"
          autoFocus
        />
        <CampoMoeda id="nota-bico-valor" label="Valor" value={valor} onChange={setValor} />
      </FormularioModal>
    </Modal>
  );
}
