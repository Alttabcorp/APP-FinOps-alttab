"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { excluirContaAnualAction, salvarContaAnualAction } from "@/app/actions/anual";
import { salvarCompraCartaoAction } from "@/app/actions/cartao";
import { CampoLinha, CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMes } from "@/components/campo-mes";
import { CampoPassos } from "@/components/campo-passos";
import { CampoMoeda } from "@/components/campo-moeda";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { LinhaMeta } from "@/lib/application/dashboard-visao";
import { ehAPagar, progressoPagamento } from "@/lib/application/checklist";
import type { ItemDTO, MesDTO } from "@/lib/application/mes-mapper";
import type { ContaAnualDTO } from "@/lib/application/anual-mapper";
import { valorDaParcela, type ParcelaCartao } from "@/lib/domain/financeiro/cartao";
import { formatarMesCalendario, sugerirReservaMensal } from "@/lib/domain/financeiro/anual";
import { formatarCompetenciaCurta } from "@/lib/domain/financeiro/competencia";
import type { ResultadoMes } from "@/lib/domain/financeiro/tipos";
import type { CampoMarca } from "@/lib/domain/financeiro/transferencia";
import { formatarMoeda } from "@/lib/formatacao";

type CampoNota = "feiraReal" | "gasolinaReal" | "cartaoReal" | "fundoReal" | "alttabReal" | "poupancaReal";

type SuperficieNota = "inicio" | "entradas" | "contas" | "investimentos";

type Editor = { tipo: "nova" } | { tipo: "bico" } | { tipo: "anual"; id: string };

type IdEtapa = "entrou" | "contas" | "poupanca" | "fundo" | "meta" | "alttab";

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
  onNovaConta?: (nome: string, valor: number, pago: boolean, tipo?: "EXTRA_MES" | "CONTA") => void;
  contasAnuais?: ContaAnualDTO[];
  onNovoBico?: (nome: string, valor: number) => void;
  onRemover?: (indice: number) => void;
  onRenomear?: (indice: number, nome: string) => void;
  removido?: { item: ItemDTO } | null;
  onDesfazer?: () => void;
  onMarcarDeposito?: (campo: CampoMarca, feito: boolean) => void;
  somenteLeitura?: boolean;
};

const temValor = (valor: number) => Math.abs(valor) >= 0.005;

export function NotaMes({
  mes,
  totais,
  metas = [],
  parcelasCartao = [],
  superficie = "inicio",
  onToggle,
  onSalvarConta,
  onSalvarItem,
  onSalvarCampo,
  onNovaConta,
  contasAnuais = [],
  onNovoBico,
  onRemover,
  onRenomear,
  removido = null,
  onDesfazer,
  onMarcarDeposito,
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
  const poupancaSugestao = totais?.investimentos.poupanca.sugestao ?? 0;
  const poupancaValor = mes.poupancaEditado ? mes.poupancaReal : poupancaSugestao;
  const fundoSugestao = totais?.investimentos.fundo.sugestao ?? 0;
  const alttabSugestao = totais?.investimentos.alttab.sugestao ?? 0;
  const paraMeta = totais?.distribuicao.metaFinal ?? 0;
  const fundo = totais?.investimentos.fundo;
  const agora = etapaAtual(mes, pagamento, totais, superficie);
  const passo = textoProximoPasso(mes, pagamento, totais, superficie);

  const abrir = (proximo: Editor) => {
    if (somenteLeitura) return;
    setEditor(proximo);
  };

  return (
    <section
      className={`nota ${superficie !== "investimentos" ? "is-inicio" : ""}`}
      aria-labelledby="rito-titulo"
    >
      {superficie === "investimentos" ? (
        <header className="nota-cabeca">
          <div className="min-w-0">
            <h2 id="rito-titulo" className="titulo-secao">
              Aportes deste mês
            </h2>
            {passo ? <p className="nota-passo mt-2">{passo}</p> : null}
          </div>
        </header>
      ) : (
        <header className="nota-cabeca is-fina">
          <h2 id="rito-titulo" className="sr-only">
            {superficie === "entradas" ? "Entradas do mês" : superficie === "contas" ? "Contas do mês" : "Neste mês"}
          </h2>
          {passo ? <p className="nota-passo">{passo}</p> : null}
        </header>
      )}

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
              <LinhaValor
                id="nota-poupanca"
                nome="Poupança"
                valor={poupancaValor}
                detalhe={!mes.poupancaEditado && poupancaSugestao > 0.005 ? "sugestão" : undefined}
                sugestao={poupancaSugestao}
                onChange={(valor) => onSalvarCampo("poupancaReal", valor)}
                feito={mes.depositos?.poupanca}
                onFeito={onMarcarDeposito ? (feito) => onMarcarDeposito("poupanca", feito) : undefined}
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
              <LinhaValor
                id="nota-fundo"
                nome="Fundo imobiliário"
                valor={mes.fundoReal}
                sugestao={fundoSugestao}
                onChange={(valor) => onSalvarCampo("fundoReal", valor)}
                feito={mes.depositos?.fundo}
                onFeito={onMarcarDeposito ? (feito) => onMarcarDeposito("fundo", feito) : undefined}
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
            {paraMeta > 0.005 ? (
              <ul>
                <li>
                  <div className={`nota-linha is-editavel ${mes.depositos?.meta ? "is-paga" : ""}`}>
                    <input
                      className="checkbox-pago shrink-0"
                      type="checkbox"
                      checked={Boolean(mes.depositos?.meta)}
                      disabled={somenteLeitura || !onMarcarDeposito}
                      aria-label="Depósito na meta feito"
                      onChange={(evento) => onMarcarDeposito?.("meta", evento.target.checked)}
                    />
                    <span className="nota-nome">Depósito na meta</span>
                    <span className="nota-valor money">{formatarMoeda(paraMeta)}</span>
                  </div>
                </li>
              </ul>
            ) : null}
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
              <LinhaValor
                id="nota-alttab"
                nome="Depósito na empresa"
                valor={mes.alttabReal}
                sugestao={alttabSugestao}
                onChange={(valor) => onSalvarCampo("alttabReal", valor)}
                feito={mes.depositos?.alttab}
                onFeito={onMarcarDeposito ? (feito) => onMarcarDeposito("alttab", feito) : undefined}
                somenteLeitura={somenteLeitura}
              />
            </ul>
          </Etapa>
        </div>
      ) : (
        <div className="rito-corpo is-inicio">
          {superficie === "inicio" || superficie === "entradas" ? (
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
                  Fontes
                </Link>{" "}
                abaixo e lancem o valor aqui quando o dinheiro chegar.
              </p>
            ) : (
              <>
                {(() => {
                  const lista = saldos;
                  return (
                    <>
                      {lista.length > 0 ? (
                        <ul>
                          {lista.map(({ item, indice }) => (
                            <LinhaValor
                              key={`${item.tipo}-${indice}-${item.nome}`}
                              id={`nota-entrada-${indice}`}
                              nome={item.nome || "Sem nome"}
                              valor={item.valor}
                              onChange={(valor) => onSalvarItem(indice, valor)}
                              onRemover={onRemover ? () => onRemover(indice) : undefined}
                              somenteLeitura={somenteLeitura}
                            />
                          ))}
                        </ul>
                      ) : null}
                    </>
                  );
                })()}
                {vales.length > 0 || outrosExtra.length > 0 ? (
                  <div className="rito-sub">
                    <p className="rito-sub-titulo">Vales</p>
                    {(() => {
                      const origem = [...vales, ...outrosExtra];
                      const lista = origem;
                      return (
                        <>
                          {lista.length > 0 ? (
                            <ul>
                              {lista.map(({ item, indice }) => (
                                <LinhaValor
                                  key={`${item.tipo}-${indice}-${item.nome}`}
                                  id={`nota-vale-${indice}`}
                                  nome={item.nome || "Sem nome"}
                                  valor={item.valor}
                                  detalhe={rotuloEntrada(item)}
                                  onChange={(valor) => onSalvarItem(indice, valor)}
                              onRemover={onRemover ? () => onRemover(indice) : undefined}
                                  somenteLeitura={somenteLeitura}
                                />
                              ))}
                            </ul>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
                {rendimentos.length > 0 ? (
                  <div className="rito-sub">
                    <p className="rito-sub-titulo">Rendimento das contas e da meta</p>
                    {(() => {
                      const lista = rendimentos;
                      return (
                        <>
                          {lista.length > 0 ? (
                            <ul>
                              {lista.map(({ item, indice }) => (
                                <LinhaValor
                                  key={`${item.tipo}-${indice}-${item.nome}`}
                                  id={`nota-rendimento-${indice}`}
                                  nome={item.nome || "Sem nome"}
                                  valor={item.valor}
                                  onChange={(valor) => onSalvarItem(indice, valor)}
                              onRemover={onRemover ? () => onRemover(indice) : undefined}
                                  somenteLeitura={somenteLeitura}
                                />
                              ))}
                            </ul>
                          ) : null}
                        </>
                      );
                    })()}
                    {totais && totais.rendimento.total >= 0.005 ? (
                      <p className="rito-nota">
                        {totais.rendimento.apertado
                          ? `${formatarMoeda(totais.rendimento.paraContas)} nas contas. ${formatarMoeda(totais.rendimento.reinvestido)} reinvestido.`
                          : `Reinvestido ${formatarMoeda(totais.rendimento.reinvestido)}.`}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </Etapa>
          ) : null}

          {superficie === "inicio" || superficie === "contas" ? (
          <Etapa
            id="rito-contas"
            numero={superficie === "contas" ? 1 : 2}
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
            {contas.length === 0 && parcelasCartao.length === 0 ? (
              <p className="rito-vazio">
                Contas que se repetem se cadastram abaixo. Extra só deste mês: Nova conta.
              </p>
            ) : (
              <>
                {(() => {
                  const lista = contas;
                  return (
                    <>
                      {lista.length > 0 || parcelasCartao.length > 0 ? (
                        <ul>
                          {lista.map(({ item, indice }) => (
                            <LinhaConta
                              key={`${item.tipo}-${indice}-${item.nome}`}
                              item={item}
                              indice={indice}
                              onToggle={onToggle}
                              onChange={(valor) => onSalvarConta(indice, valor, item.pago)}
                              onRemover={
                                onRemover && item.tipo !== "ANUAL" ? () => onRemover(indice) : undefined
                              }
                              onRenomear={
                                onRenomear && item.tipo !== "ANUAL" ? (nome) => onRenomear(indice, nome) : undefined
                              }
                              onEditarAnual={
                                item.tipo === "ANUAL" && item.contaAnualId
                                  ? () => abrir({ tipo: "anual", id: item.contaAnualId as string })
                                  : undefined
                              }
                              somenteLeitura={somenteLeitura}
                            />
                          ))}
                          {parcelasCartao.map((parcela) => (
                            <LinhaParcelaCartao
                              key={`parcela-${parcela.nome}-${parcela.atual}-${parcela.total}`}
                              parcela={parcela}
                              competenciaMes={mes.competencia}
                            />
                          ))}
                        </ul>
                      ) : null}
                    </>
                  );
                })()}
              </>
            )}
            <div className="rito-sub" id="rito-feira">
                <p className="rito-sub-titulo">Feira e gasolina</p>
                <ul>
                  <LinhaValor
                    id="nota-feira"
                    nome="Feira"
                    valor={mes.feiraReal}
                    onChange={(valor) => onSalvarCampo("feiraReal", valor)}
                    somenteLeitura={somenteLeitura}
                  />
                  <LinhaValor
                    id="nota-gasolina"
                    nome="Gasolina"
                    valor={mes.gasolinaReal}
                    onChange={(valor) => onSalvarCampo("gasolinaReal", valor)}
                    somenteLeitura={somenteLeitura}
                  />
                </ul>
            </div>
          </Etapa>
          ) : null}
        </div>
      )}

      {(editor?.tipo === "nova" || editor?.tipo === "anual") && onNovaConta ? (
        <ModalNovaConta
          competencia={mes.competencia}
          anualEditando={
            editor.tipo === "anual" ? (contasAnuais.find((conta) => conta.id === editor.id) ?? null) : null
          }
          onClose={() => setEditor(null)}
          onSalvar={(nome, valor, pago, tipo) => {
            onNovaConta(nome, valor, pago, tipo);
            setEditor(null);
          }}
          onSalvouExterno={() => setEditor(null)}
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

      {removido && onDesfazer ? (
        <div className="aviso-desfazer" role="status">
          <span>“{removido.item.nome || "Conta"}” removida.</span>
          <button type="button" className="btn-link" onClick={onDesfazer}>
            Desfazer
          </button>
        </div>
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
  if (superficie === "entradas") {
    return totais && totais.resumo.ganhou >= 0.005 ? null : "entrou";
  }
  if (superficie === "contas") {
    return pagamento.total > 0 && pagamento.pagas < pagamento.total ? "contas" : null;
  }
  if (!totais) return "entrou";
  if (totais.resumo.ganhou < 0.005) return "entrou";
  if (pagamento.total > 0 && pagamento.pagas < pagamento.total) return "contas";
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
  if (superficie === "entradas") {
    return agora === "entrou" ? "Digite o que entrou na linha." : "Entradas do mês.";
  }
  if (superficie === "contas") {
    if (agora === "contas") {
      return pagamento.pagas === 0
        ? "Digite as contas e marque as pagas."
        : `Faltam ${pagamento.total - pagamento.pagas} ${
            pagamento.total - pagamento.pagas === 1 ? "conta" : "contas"
          }.`;
    }
    return "Contas do mês.";
  }
  if (agora === "entrou") return "Digite o que entrou na linha.";
  if (agora === "contas") {
    return pagamento.pagas === 0
      ? "Digite as contas e marque as pagas."
      : `Faltam ${pagamento.total - pagamento.pagas} ${
          pagamento.total - pagamento.pagas === 1 ? "conta" : "contas"
        }.`;
  }
  return "Pronto. O saldo é o que entrou menos as pagas.";
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

function BotaoRemover({ nome, onClick }: { nome: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn-remover"
      aria-label={`Remover ${nome}`}
      title={`Remover ${nome}`}
      onClick={onClick}
    >
      ✕
    </button>
  );
}

function LinhaConta({
  item,
  indice,
  onToggle,
  onChange,
  onRemover,
  onEditarAnual,
  onRenomear,
  somenteLeitura,
}: {
  item: ItemDTO;
  indice: number;
  onToggle: (indice: number, pago: boolean) => void;
  onChange: (valor: number) => void;
  onRemover?: () => void;
  onEditarAnual?: () => void;
  onRenomear?: (nome: string) => void;
  somenteLeitura: boolean;
}) {
  const id = `nota-pago-${item.tipo}-${indice}`;
  const [renomeando, setRenomeando] = useState(false);
  const [rascunho, setRascunho] = useState(item.nome);
  const concluirNome = () => {
    setRenomeando(false);
    const limpo = rascunho.trim();
    if (limpo && limpo !== item.nome) onRenomear?.(limpo);
    else setRascunho(item.nome);
  };
  return (
    <li>
      <div className={`nota-linha is-editavel ${item.pago ? "is-paga" : ""}`}>
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
        <span className="nota-nome">
          {renomeando ? (
            <input
              className="nota-nome-input"
              aria-label={`Novo nome de ${item.nome}`}
              value={rascunho}
              autoFocus
              onChange={(evento) => setRascunho(evento.target.value)}
              onBlur={concluirNome}
              onKeyDown={(evento) => {
                if (evento.key === "Enter") evento.currentTarget.blur();
                if (evento.key === "Escape") {
                  setRascunho(item.nome);
                  setRenomeando(false);
                }
              }}
            />
          ) : onRenomear && !somenteLeitura ? (
            <button
              type="button"
              className="nota-nome-botao"
              title="Renomear"
              onClick={() => {
                setRascunho(item.nome);
                setRenomeando(true);
              }}
            >
              {item.nome || "Sem nome"}
            </button>
          ) : (
            item.nome || "Sem nome"
          )}
          {item.tipo === "EXTRA_MES" ? <span className="nota-tag">extra</span> : null}
          {item.tipo === "ANUAL" ? <span className="nota-tag">anual</span> : null}
        </span>
        <div className="nota-campo">
          <CampoMoeda
            id={`nota-conta-valor-${indice}`}
            label={`Valor de ${item.nome || "conta"}`}
            value={item.valor}
            onChange={onChange}
            rotuloVisivel={false}
            compact
            disabled={somenteLeitura}
          />
        </div>
        {onEditarAnual && !somenteLeitura ? (
          <button
            type="button"
            className="btn-link text-xs shrink-0"
            aria-label={`Editar conta anual ${item.nome}`}
            onClick={onEditarAnual}
          >
            editar
          </button>
        ) : null}
        {onRemover && !somenteLeitura ? <BotaoRemover nome={item.nome || "conta"} onClick={onRemover} /> : null}
      </div>
    </li>
  );
}

/** Lembrete de parcela do cartão: só exibe (valor na fatura). */
function LinhaParcelaCartao({
  parcela,
  competenciaMes,
}: {
  parcela: ParcelaCartao;
  competenciaMes: string;
}) {
  return (
    <li>
      <div className="nota-linha is-parcela-cartao">
        <span className="nota-nome">
          <Link
            className="nota-parcela-link"
            href={`/cartao?mes=${encodeURIComponent(competenciaMes)}`}
          >
            {parcela.nome || "Parcela"}
          </Link>
          <span className="nota-tag is-cartao">cartão</span>
          <span className="nota-tag is-prazo" aria-label={`Parcela ${parcela.atual} de ${parcela.total}`}>
            {parcela.atual}/{parcela.total}
          </span>
        </span>
        <span className="nota-valor money">{formatarMoeda(parcela.valor)}</span>
      </div>
    </li>
  );
}

function LinhaValor({
  id,
  nome,
  valor,
  detalhe,
  sugestao,
  onChange,
  onRemover,
  feito,
  onFeito,
  somenteLeitura,
}: {
  id: string;
  nome: string;
  valor: number;
  detalhe?: string;
  sugestao?: number;
  onChange: (valor: number) => void;
  onRemover?: () => void;
  feito?: boolean;
  onFeito?: (feito: boolean) => void;
  somenteLeitura: boolean;
}) {
  const mostraSugestao =
    !somenteLeitura &&
    sugestao != null &&
    sugestao > 0.005 &&
    Math.abs(valor - sugestao) > 0.005;

  return (
    <li>
      <div className={`nota-linha is-editavel ${feito ? "is-paga" : ""}`}>
        {onFeito ? (
          <input
            className="checkbox-pago shrink-0"
            type="checkbox"
            checked={Boolean(feito)}
            disabled={somenteLeitura}
            aria-label={`${nome} feito`}
            onChange={(evento) => onFeito(evento.target.checked)}
          />
        ) : (
          <span className="nota-marca" aria-hidden="true" />
        )}
        <div className="nota-linha-corpo">
          <span className="nota-nome">
            {nome}
            {detalhe ? <span className="nota-tag">{detalhe}</span> : null}
          </span>
          {mostraSugestao ? (
            <button
              className="btn-link nota-sugestao"
              type="button"
              onClick={() => onChange(sugestao)}
            >
              Usar sugestão
            </button>
          ) : null}
        </div>
        <div className="nota-campo">
          <CampoMoeda
            id={id}
            label={`Valor de ${nome}`}
            value={valor}
            onChange={onChange}
            rotuloVisivel={false}
            compact
            disabled={somenteLeitura}
          />
        </div>
        {onRemover && !somenteLeitura ? <BotaoRemover nome={nome} onClick={onRemover} /> : null}
      </div>
    </li>
  );
}

function LinhaLink({ nome, valor, href }: { nome: string; valor: number; href: string }) {
  const vazio = !temValor(valor);
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
  const vazio = !temValor(valor);
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

type TipoNovaConta = "mes" | "fixa" | "anual" | "cartao";

const OPCOES_TIPO: { id: TipoNovaConta; rotulo: string; detalhe: string }[] = [
  { id: "mes", rotulo: "Só este mês", detalhe: "Uma conta avulsa." },
  { id: "fixa", rotulo: "Todo mês", detalhe: "Fixa: volta nos próximos meses." },
  { id: "anual", rotulo: "Anual", detalhe: "IPTU, IPVA: junta um pedaço por mês." },
  { id: "cartao", rotulo: "Cartão", detalhe: "Entra na fatura, com ou sem parcelas." },
];

export function ModalNovaConta({
  competencia,
  anualEditando,
  inicioCartaoPadrao,
  onClose,
  onSalvar,
  onSalvouExterno,
}: {
  competencia: string;
  inicioCartaoPadrao?: string;
  anualEditando: ContaAnualDTO | null;
  onClose: () => void;
  onSalvar: (nome: string, valor: number, pago: boolean, tipo: "EXTRA_MES" | "CONTA") => void;
  onSalvouExterno: () => void;
}) {
  const router = useRouter();
  const [pendente, start] = useTransition();
  const editandoAnual = anualEditando != null;
  const mesCompetencia = Number(competencia.slice(5));
  const [tipo, setTipo] = useState<TipoNovaConta>(editandoAnual ? "anual" : "mes");
  const [nome, setNome] = useState(anualEditando?.nome ?? "");
  const [valor, setValor] = useState(anualEditando?.valor ?? 0);
  const [pago, setPago] = useState(true);
  const [parcelado, setParcelado] = useState(false);
  const [parcelas, setParcelas] = useState(2);
  const [inicio, setInicio] = useState(inicioCartaoPadrao ?? competencia);
  const [mesCobranca, setMesCobranca] = useState(anualEditando?.mes ?? mesCompetencia);
  const [dia, setDia] = useState(anualEditando?.dia ?? 10);
  const [mesesJuntar, setMesesJuntar] = useState<number | null>(anualEditando?.parcelas ?? null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");

  const reserva = sugerirReservaMensal(valor, mesCobranca, competencia);
  const juntar = mesesJuntar ?? reserva.meses;
  const nParcelas = tipo === "cartao" && parcelado ? parcelas : 1;

  const resumo = (() => {
    const rotulo = nome.trim() || "Conta";
    if (valor <= 0) {
      return tipo === "cartao"
        ? "Informe o valor e, se foi parcelado, em quantas vezes."
        : tipo === "anual"
          ? "Informe o valor do ano e quando cobra."
          : "Informe o nome e o valor.";
    }
    if (tipo === "mes") return `${rotulo} · ${formatarMoeda(valor)} só neste mês`;
    if (tipo === "fixa") return `${rotulo} · ${formatarMoeda(valor)} todo mês`;
    if (tipo === "anual") {
      return `${rotulo} · ${formatarMoeda(valor)} no ano · ${juntar}x de ${formatarMoeda(valorDaParcela(valor, juntar, 0))}`;
    }
    return nParcelas > 1
      ? `${rotulo} · ${nParcelas}x de ${formatarMoeda(valorDaParcela(valor, nParcelas, 0))} a partir de ${formatarCompetenciaCurta(inicio)}`
      : `${rotulo} · ${formatarMoeda(valor)} no cartão em ${formatarCompetenciaCurta(inicio)}`;
  })();

  const concluir = (acao: () => Promise<{ ok: boolean; erro?: string }>) => {
    start(async () => {
      const resposta = await acao();
      if (!resposta.ok) {
        setErro(resposta.erro ?? "Não foi possível salvar.");
        return;
      }
      onSalvouExterno();
      router.refresh();
    });
  };

  const enviar = () => {
    if (!nome.trim()) {
      setErro("Dê um nome para a conta.");
      return;
    }
    if (tipo === "mes" || tipo === "fixa") {
      onSalvar(nome, valor, pago, tipo === "fixa" ? "CONTA" : "EXTRA_MES");
      return;
    }
    if (valor <= 0) {
      setErro("Informe o valor.");
      return;
    }
    if (tipo === "anual") {
      concluir(() =>
        salvarContaAnualAction({
          id: anualEditando?.id,
          nome: nome.trim(),
          valor,
          dia,
          mes: mesCobranca,
          parcelas: juntar,
          lado: anualEditando?.lado ?? "CASA",
          banco: anualEditando?.banco ?? "",
          chavePix: anualEditando?.chavePix ?? "",
        }),
      );
      return;
    }
    concluir(() =>
      salvarCompraCartaoAction({
        nome: nome.trim(),
        valorTotal: valor,
        parcelas: nParcelas,
        competenciaInicio: inicio,
      }),
    );
  };

  const rotuloSalvar =
    tipo === "cartao" ? "Salvar compra" : tipo === "anual" ? "Salvar conta anual" : "Registrar";

  return (
    <Modal
      aberto
      titulo={editandoAnual ? "Editar conta anual" : "Nova conta"}
      descricao={editandoAnual ? "Ajuste o valor ou quando cobra." : "Escolha de que tipo é a conta."}
      onClose={onClose}
    >
      <FormularioModal
        resumo={resumo}
        erro={erro}
        onSubmit={enviar}
        acoes={
          <AcoesCadastro
            pendente={pendente}
            podeExcluir={editandoAnual}
            confirmarExclusao={confirmarExclusao}
            onPedirExclusao={() => setConfirmarExclusao(true)}
            onCancelarExclusao={() => setConfirmarExclusao(false)}
            onExcluir={() => concluir(() => excluirContaAnualAction(anualEditando?.id ?? ""))}
            onVoltar={onClose}
            salvar={rotuloSalvar}
            excluir="Remover conta anual"
          />
        }
      >
        {editandoAnual ? null : (
          <fieldset className="tipo-conta" aria-label="Tipo da conta">
            {OPCOES_TIPO.map((opcao) => (
              <label key={opcao.id} className={`tipo-conta-opcao ${tipo === opcao.id ? "is-ativo" : ""}`}>
                <input
                  type="radio"
                  name="tipo-nova-conta"
                  value={opcao.id}
                  checked={tipo === opcao.id}
                  onChange={() => {
                    setTipo(opcao.id);
                    setErro("");
                  }}
                />
                <span className="tipo-conta-rotulo">{opcao.rotulo}</span>
                <span className="tipo-conta-detalhe">{opcao.detalhe}</span>
              </label>
            ))}
          </fieldset>
        )}
        <CampoTexto
          id="nota-nova-nome"
          label={tipo === "cartao" ? "O que foi comprado" : "Nome"}
          value={nome}
          onChange={(proximo) => {
            setNome(proximo);
            setErro("");
          }}
          placeholder={tipo === "anual" ? "Ex.: IPTU, IPVA, domínio…" : "Ex.: IPTV, Magazine Luiza…"}
          autoFocus
        />
        {tipo === "cartao" ? (
          <>
            <label className="nota-pago-campo" htmlFor="nota-nova-parcelado">
              <input
                id="nota-nova-parcelado"
                className="checkbox-pago shrink-0"
                type="checkbox"
                checked={parcelado}
                onChange={(evento) => setParcelado(evento.target.checked)}
              />
              <span>Foi parcelado</span>
            </label>
            <CampoLinha>
              <CampoMoeda
                id="nota-nova-valor"
                label={parcelado ? "Valor total" : "Valor"}
                value={valor}
                onChange={setValor}
              />
              {parcelado ? (
                <CampoPassos
                  id="nota-nova-parcelas"
                  label="Parcelas"
                  value={parcelas}
                  min={2}
                  max={48}
                  onChange={setParcelas}
                  detalhe={valor > 0 ? `${parcelas}x de ${formatarMoeda(valorDaParcela(valor, parcelas, 0))}` : undefined}
                />
              ) : null}
            </CampoLinha>
            <CampoMes
              id="nota-nova-inicio"
              label={parcelado ? "Primeira parcela" : "Mês da fatura"}
              value={inicio}
              onChange={setInicio}
            />
          </>
        ) : tipo === "anual" ? (
          <>
            <CampoMoeda id="nota-nova-valor" label="Valor no ano" value={valor} onChange={setValor} />
            <CampoLinha>
              <CampoSelect
                id="nota-anual-mes"
                label="Mês da cobrança"
                value={String(mesCobranca)}
                onChange={(proximo) => {
                  setMesCobranca(Number(proximo));
                  setMesesJuntar(null);
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {formatarMesCalendario(m)}
                  </option>
                ))}
              </CampoSelect>
              <CampoPassos id="nota-anual-dia" label="Dia" value={dia} min={1} max={31} onChange={setDia} />
            </CampoLinha>
            <CampoPassos
              id="nota-anual-meses"
              label="Meses para juntar"
              value={juntar}
              min={1}
              max={12}
              onChange={setMesesJuntar}
              detalhe={valor > 0 ? `${juntar}x de ${formatarMoeda(valorDaParcela(valor, juntar, 0))}` : undefined}
            />
          </>
        ) : (
          <>
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
          </>
        )}
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
