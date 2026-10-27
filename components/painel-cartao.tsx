"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  excluirCompraCartaoAction,
  excluirRecorrenteCartaoAction,
  salvarCompraCartaoAction,
  salvarRecorrenteCartaoAction,
} from "@/app/actions/cartao";
import { Bloco } from "@/components/bloco";
import { CampoLinha, CampoTexto } from "@/components/campo";
import { CampoMes } from "@/components/campo-mes";
import { CampoMoeda } from "@/components/campo-moeda";
import { CampoPassos } from "@/components/campo-passos";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type {
  CompraCartaoDTO,
  CompraCartaoPayload,
  RecorrenteCartaoDTO,
} from "@/lib/application/cartao-mapper";
import { faturaDoMes, parcelaNaCompetencia, somarRecorrentes, valorDaParcela } from "@/lib/domain/financeiro/cartao";
import {
  avancarCompetencia,
  competenciaAtual,
  formatarCompetenciaCurta,
  formatarNomeMes,
} from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

type Rascunho = {
  id?: string;
  nome: string;
  valorTotal: number;
  parcelas: number;
  competenciaInicio: string;
};

type RascunhoFixo = {
  id?: string;
  nome: string;
  valor: number;
};

const rascunhoVazio = (): Rascunho => ({
  nome: "",
  valorTotal: 0,
  parcelas: 12,
  competenciaInicio: competenciaAtual(),
});

const rascunhoFixoVazio = (): RascunhoFixo => ({
  nome: "",
  valor: 0,
});

type Props = {
  compras: CompraCartaoDTO[];
  recorrentes: RecorrenteCartaoDTO[];
  teto?: number;
  abrirNovo?: boolean;
  abrirFixo?: boolean;
};

export function PainelCartao({
  compras,
  recorrentes,
  teto = 0,
  abrirNovo = false,
  abrirFixo = false,
}: Props) {
  const router = useRouter();
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [editorFixo, setEditorFixo] = useState<RascunhoFixo | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const mesAtual = competenciaAtual();
  const parcelas = useMemo(() => faturaDoMes(compras, mesAtual), [compras, mesAtual]);
  const fixo = useMemo(() => somarRecorrentes(recorrentes), [recorrentes]);
  const fatura = parcelas + fixo;
  const disponivel = Math.max(0, teto - fatura);

  useEffect(() => {
    if (abrirFixo) {
      setErro("");
      setConfirmarExclusao(false);
      setEditorFixo(rascunhoFixoVazio());
      return;
    }
    if (!abrirNovo) return;
    setErro("");
    setConfirmarExclusao(false);
    setEditor(rascunhoVazio());
  }, [abrirNovo, abrirFixo]);

  const fechar = () => {
    setEditor(null);
    setEditorFixo(null);
    setConfirmarExclusao(false);
    setErro("");
  };

  const salvar = () => {
    if (!editor) return;
    const payload: CompraCartaoPayload = {
      id: editor.id,
      nome: editor.nome,
      valorTotal: editor.valorTotal,
      parcelas: editor.parcelas,
      competenciaInicio: editor.competenciaInicio,
    };
    startTransition(async () => {
      const resposta = await salvarCompraCartaoAction(payload);
      if (resposta.ok) {
        setStatus(editor.id ? "Compra atualizada." : "Compra cadastrada.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const salvarFixo = () => {
    if (!editorFixo) return;
    startTransition(async () => {
      const resposta = await salvarRecorrenteCartaoAction(editorFixo);
      if (resposta.ok) {
        setStatus(editorFixo.id ? "Gasto fixo atualizado." : "Gasto fixo cadastrado.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const excluir = () => {
    if (!editor?.id) return;
    startTransition(async () => {
      const resposta = await excluirCompraCartaoAction(editor.id as string);
      if (resposta.ok) {
        setStatus("Compra removida.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const excluirFixo = () => {
    if (!editorFixo?.id) return;
    startTransition(async () => {
      const resposta = await excluirRecorrenteCartaoAction(editorFixo.id as string);
      if (resposta.ok) {
        setStatus("Gasto fixo removido.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <dl className="rito-faixa">
        <div>
          <dt>Fatura de {formatarNomeMes(mesAtual)}</dt>
          <dd className={`amount ${teto > 0.005 && fatura > teto + 0.005 ? "text-outflow" : ""}`}>
            {formatarMoeda(fatura)}
          </dd>
        </div>
        <div>
          <dt>Pode pagar neste mês</dt>
          <dd className="amount">{formatarMoeda(teto)}</dd>
        </div>
        <div>
          <dt>Ainda cabe</dt>
          <dd className={`amount ${disponivel > 0.005 ? "text-inflow" : "text-mute"}`}>
            {formatarMoeda(disponivel)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-mute">
        Depois das contas, o que sobra é o teto do cartão. Gastos fixos e parcelas já entram na fatura.
      </p>
      {teto > 0.005 && fatura > teto + 0.005 ? (
        <p className="rito-aperto mt-3">
          A fatura passa do que sobrou depois das contas. Não gastem mais neste cartão neste mês.
        </p>
      ) : null}

      <Bloco
        titulo="Gasto fixo no cartão"
        nota="Academia, Cursor, iCloud, Amazon. Todo mês entra na fatura."
        acao={
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setErro("");
              setConfirmarExclusao(false);
              setEditorFixo(rascunhoFixoVazio());
            }}
          >
            Cadastrar gasto fixo
          </button>
        }
      >
        {recorrentes.length === 0 ? (
          <p className="vazio">Nenhum gasto fixo no cartão ainda.</p>
        ) : (
          <ul className="grid gap-3">
            {recorrentes.map((item) => (
              <li key={item.id} className="ficha ficha-linha">
                <div className="ficha-topo">
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-tight">{item.nome}</h3>
                    <p className="mt-1 text-sm text-mute">Todo mês, no cartão</p>
                  </div>
                  <div className="ficha-valor">
                    <p className="amount text-[1.35rem]">{formatarMoeda(item.valor)}</p>
                    <button
                      className="btn shrink-0 text-sm"
                      type="button"
                      onClick={() => {
                        setErro("");
                        setConfirmarExclusao(false);
                        setEditorFixo({ id: item.id, nome: item.nome, valor: item.valor });
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <Bloco
        titulo="Compras parceladas"
        nota="Cada parcela entra na fatura do mês correspondente."
        acao={
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setErro("");
              setConfirmarExclusao(false);
              setEditor(rascunhoVazio());
            }}
          >
            Cadastrar compra
          </button>
        }
      >
        {compras.length === 0 ? (
          <p className="vazio">Nenhuma compra parcelada. Cadastre o PC em 12 vezes.</p>
        ) : (
          <ul className="grid gap-3">
            {compras.map((compra) => {
              const parcela = parcelaNaCompetencia(compra, mesAtual);
              const fim = avancarCompetencia(compra.competenciaInicio, compra.parcelas - 1);
              return (
                <li key={compra.id} className="ficha ficha-linha">
                  <div className="ficha-topo">
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-tight">{compra.nome}</h3>
                      <p className="mt-1 text-sm text-mute">
                        {compra.parcelas}x de {formatarMoeda(compra.valorParcela)} · até{" "}
                        {formatarCompetenciaCurta(fim)}
                      </p>
                      <p className="mt-1 text-sm text-mute">
                        {parcela
                          ? `Parcela ${parcela.atual}/${parcela.total} neste mês: ${formatarMoeda(parcela.valor)}`
                          : "Não entra nesta fatura"}
                      </p>
                    </div>
                    <div className="ficha-valor">
                      <p className="amount text-[1.35rem]">{formatarMoeda(compra.valorTotal)}</p>
                      <button
                        className="btn shrink-0 text-sm"
                        type="button"
                        onClick={() => {
                          setErro("");
                          setConfirmarExclusao(false);
                          setEditor({
                            id: compra.id,
                            nome: compra.nome,
                            valorTotal: compra.valorTotal,
                            parcelas: compra.parcelas,
                            competenciaInicio: compra.competenciaInicio,
                          });
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Bloco>

      <p className="mt-6 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={Boolean(editorFixo)}
        titulo={editorFixo?.id ? "Editar gasto fixo" : "Gasto fixo no cartão"}
        descricao="Academia, Cursor, iCloud, Amazon. Entra todo mês na fatura, como conta fixa."
        onClose={fechar}
      >
        {editorFixo ? (
          <FormularioModal
            onSubmit={salvarFixo}
            resumo={
              editorFixo.valor > 0
                ? `${editorFixo.nome.trim() || "Gasto"} · ${formatarMoeda(editorFixo.valor)} todo mês no cartão`
                : "Informe o valor mensal. Entra sozinho na fatura."
            }
            erro={erro}
            acoes={
              <AcoesCadastro
                pendente={pendente}
                podeExcluir={Boolean(editorFixo.id)}
                confirmarExclusao={confirmarExclusao}
                onPedirExclusao={() => setConfirmarExclusao(true)}
                onCancelarExclusao={() => setConfirmarExclusao(false)}
                onExcluir={excluirFixo}
                salvar="Salvar gasto fixo"
                excluir="Remover gasto"
              />
            }
          >
            <CampoTexto
              id="fixo-nome"
              label="O que cobra todo mês"
              value={editorFixo.nome}
              placeholder="Ex.: Academia, Cursor, iCloud…"
              autoFocus
              onChange={(nome) => setEditorFixo({ ...editorFixo, nome })}
            />
            <CampoMoeda
              id="fixo-valor"
              label="Valor mensal"
              value={editorFixo.valor}
              onChange={(valor) => setEditorFixo({ ...editorFixo, valor })}
            />
          </FormularioModal>
        ) : null}
      </Modal>

      <Modal
        aberto={Boolean(editor)}
        titulo={editor?.id ? "Editar compra" : "Cadastrar compra"}
        descricao="Cada parcela entra na fatura do mês correspondente."
        onClose={fechar}
      >
        {editor ? (
          <FormularioModal
            onSubmit={salvar}
            resumo={
              editor.valorTotal > 0 && editor.parcelas > 0
                ? `${editor.nome.trim() || "Compra"} · ${editor.parcelas}x de ${formatarMoeda(valorDaParcela(editor.valorTotal, editor.parcelas, 0))} a partir de ${formatarCompetenciaCurta(editor.competenciaInicio)}`
                : "Informe o valor e em quantas vezes. A fatura do mês soma sozinha."
            }
            erro={erro}
            acoes={
              <AcoesCadastro
                pendente={pendente}
                podeExcluir={Boolean(editor.id)}
                confirmarExclusao={confirmarExclusao}
                onPedirExclusao={() => setConfirmarExclusao(true)}
                onCancelarExclusao={() => setConfirmarExclusao(false)}
                onExcluir={excluir}
                salvar="Salvar compra"
                excluir="Remover compra"
              />
            }
          >
            <CampoTexto
              id="compra-nome"
              label="O que foi comprado"
              value={editor.nome}
              placeholder="Ex.: PC…"
              autoFocus
              onChange={(nome) => setEditor({ ...editor, nome })}
            />
            <CampoLinha>
              <CampoMoeda
                id="compra-total"
                label="Valor total"
                value={editor.valorTotal}
                onChange={(valorTotal) => setEditor({ ...editor, valorTotal })}
              />
              <CampoPassos
                id="compra-parcelas"
                label="Parcelas"
                value={editor.parcelas}
                min={1}
                max={48}
                onChange={(parcelas) => setEditor({ ...editor, parcelas })}
                detalhe={
                  editor.parcelas > 0 && editor.valorTotal > 0
                    ? `${editor.parcelas}x de ${formatarMoeda(valorDaParcela(editor.valorTotal, editor.parcelas, 0))}`
                    : undefined
                }
              />
            </CampoLinha>
            <CampoMes
              id="compra-inicio"
              label="Primeira parcela"
              value={editor.competenciaInicio}
              onChange={(competenciaInicio) => setEditor({ ...editor, competenciaInicio })}
            />
          </FormularioModal>
        ) : null}
      </Modal>
    </div>
  );
}
