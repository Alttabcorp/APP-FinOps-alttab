"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { excluirCompraCartaoAction, salvarCompraCartaoAction } from "@/app/actions/cartao";
import { CampoLinha, CampoTexto } from "@/components/campo";
import { CampoMes } from "@/components/campo-mes";
import { CampoMoeda } from "@/components/campo-moeda";
import { CampoPassos } from "@/components/campo-passos";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { CompraCartaoDTO, CompraCartaoPayload } from "@/lib/application/cartao-mapper";
import { faturaDoMes, parcelaNaCompetencia, valorDaParcela } from "@/lib/domain/financeiro/cartao";
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

const rascunhoVazio = (): Rascunho => ({
  nome: "",
  valorTotal: 0,
  parcelas: 12,
  competenciaInicio: competenciaAtual(),
});

type Props = {
  compras: CompraCartaoDTO[];
  abrirNovo?: boolean;
};

export function PainelCartao({ compras, abrirNovo = false }: Props) {
  const router = useRouter();
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const mesAtual = competenciaAtual();
  const fatura = useMemo(() => faturaDoMes(compras, mesAtual), [compras, mesAtual]);

  useEffect(() => {
    if (!abrirNovo) return;
    setErro("");
    setConfirmarExclusao(false);
    setEditor(rascunhoVazio());
  }, [abrirNovo]);

  const fechar = () => {
    setEditor(null);
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

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="text-sm text-mute">Fatura de {formatarNomeMes(mesAtual)}</p>
          <p className="amount mt-1 text-[1.85rem]">{formatarMoeda(fatura)}</p>
        </div>
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
      </div>

      {compras.length === 0 ? (
        <p className="vazio mt-8">
          Nenhuma compra parcelada. Cadastre o PC em 12 vezes e a fatura do mês entra sozinha.
        </p>
      ) : (
        <ul className="mt-8 grid gap-5">
          {compras.map((compra) => {
            const parcela = parcelaNaCompetencia(compra, mesAtual);
            const fim = avancarCompetencia(compra.competenciaInicio, compra.parcelas - 1);
            return (
              <li key={compra.id} className="ficha">
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-tight">{compra.nome}</h2>
                    <p className="mt-1 text-sm text-mute">
                      {compra.parcelas}x de {formatarMoeda(compra.valorParcela)} · até{" "}
                      {formatarCompetenciaCurta(fim)}
                    </p>
                  </div>
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
                </header>
                <p className="money mt-3 text-xl font-medium">{formatarMoeda(compra.valorTotal)}</p>
                <p className="mt-1 text-sm text-mute">
                  {parcela
                    ? `Parcela ${parcela.atual}/${parcela.total} neste mês: ${formatarMoeda(parcela.valor)}`
                    : "Não entra nesta fatura"}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-mute" aria-live="polite">
        {status}
      </p>

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
