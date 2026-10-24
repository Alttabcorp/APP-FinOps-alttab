"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { excluirContaAction, salvarContaAction } from "@/app/actions/conta";
import { BarraMeta } from "@/components/barra-meta";
import { CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { ContaComProgresso, ContaPayload } from "@/lib/application/conta-mapper";
import {
  FINALIDADES_CONTA,
  NOTAS_FINALIDADE,
  ROTULOS_FINALIDADE,
  avisoSaque,
  somarSaldos,
  usaMetaEstoque,
  usaMetaMensal,
  type FinalidadeConta,
} from "@/lib/domain/financeiro/conta";
import { formatarMoeda } from "@/lib/formatacao";

type Rascunho = {
  id?: string;
  nome: string;
  finalidade: FinalidadeConta;
  saldo: number;
  meta: number;
  metaMensal: number;
};

const rascunhoVazio = (): Rascunho => ({
  nome: "",
  finalidade: "META",
  saldo: 0,
  meta: 0,
  metaMensal: 0,
});

const daConta = (conta: ContaComProgresso): Rascunho => ({
  id: conta.id,
  nome: conta.nome,
  finalidade: conta.finalidade,
  saldo: conta.saldo,
  meta: conta.meta ?? 0,
  metaMensal: conta.metaMensal ?? 0,
});

type Props = {
  contas: ContaComProgresso[];
  finalidades?: FinalidadeConta[];
  finalidadePadrao?: FinalidadeConta;
  abrirNovo?: boolean;
  vazio?: string;
};

export function PainelContas({
  contas,
  finalidades = [...FINALIDADES_CONTA],
  finalidadePadrao,
  abrirNovo = false,
  vazio = "Nenhuma conta ainda. Cadastre poupança, reserva, meta, investimento ou empresa.",
}: Props) {
  const router = useRouter();
  const padrao = finalidadePadrao ?? finalidades[0] ?? "META";
  const rascunhoNovo = (): Rascunho => ({ ...rascunhoVazio(), finalidade: padrao });
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const total = useMemo(() => somarSaldos(contas), [contas]);

  useEffect(() => {
    if (!abrirNovo) return;
    setErro("");
    setConfirmarExclusao(false);
    setEditor({ nome: "", finalidade: padrao, saldo: 0, meta: 0, metaMensal: 0 });
  }, [abrirNovo, padrao]);

  const fechar = () => {
    setEditor(null);
    setConfirmarExclusao(false);
    setErro("");
  };

  const salvar = () => {
    if (!editor) return;
    const payload: ContaPayload = {
      id: editor.id,
      nome: editor.nome,
      finalidade: editor.finalidade,
      saldo: editor.saldo,
      meta: editor.meta,
      metaMensal: editor.metaMensal,
    };
    startTransition(async () => {
      const resposta = await salvarContaAction(payload);
      if (resposta.ok) {
        setStatus(editor.id ? "Conta atualizada." : "Conta cadastrada.");
        fechar();
        router.refresh();
      } else {
        setErro(resposta.erro);
      }
    });
  };

  const excluir = () => {
    if (!editor?.id) return;
    startTransition(async () => {
      const resposta = await excluirContaAction(editor.id as string);
      if (resposta.ok) {
        setStatus("Conta removida.");
        fechar();
        router.refresh();
      } else {
        setErro(resposta.erro);
      }
    });
  };

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="text-sm text-mute">Nas contas</p>
          <p className="amount mt-1 text-[1.85rem]">{formatarMoeda(total)}</p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            setErro("");
            setConfirmarExclusao(false);
            setEditor(rascunhoNovo());
          }}
        >
          Cadastrar conta
        </button>
      </div>

      {contas.length === 0 ? (
        <p className="vazio mt-8">{vazio}</p>
      ) : (
        <ul className="mt-8 grid gap-6">
          {contas.map((conta) => (
            <li key={conta.id} className="ficha">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold leading-tight text-pretty">
                    {conta.nome}
                  </h2>
                  {ROTULOS_FINALIDADE[conta.finalidade] !== conta.nome ? (
                    <p className="mt-1 text-sm text-mute">{ROTULOS_FINALIDADE[conta.finalidade]}</p>
                  ) : null}
                  <p className="mt-2 max-w-[46ch] text-sm text-mute">{NOTAS_FINALIDADE[conta.finalidade]}</p>
                  {avisoSaque(conta.finalidade) ? (
                    <p className="mt-1 text-sm text-outflow">{avisoSaque(conta.finalidade)}</p>
                  ) : null}
                </div>
                <button
                  className="btn shrink-0 text-sm"
                  type="button"
                  onClick={() => {
                    setErro("");
                    setConfirmarExclusao(false);
                    setEditor(daConta(conta));
                  }}
                >
                  Editar
                </button>
              </header>

              <p className="money mt-4 text-2xl font-medium">{formatarMoeda(conta.saldo)}</p>
              {conta.progresso.temMeta ? (
                <div className="mt-4">
                  <p className="text-sm text-mute">
                    {formatarMoeda(conta.saldo)} de {formatarMoeda(conta.progresso.meta)}
                  </p>
                  <p className="mt-1 text-sm text-mute">
                    {conta.progresso.atingida ? "Meta atingida" : `Faltam ${formatarMoeda(conta.progresso.falta)}`}
                  </p>
                  <div className="mt-3">
                    <BarraMeta nome={conta.nome} progresso={conta.progresso} destaque />
                  </div>
                </div>
              ) : null}
              {conta.metaMensal && conta.metaMensal > 0.005 ? (
                <p className="mt-3 text-sm text-mute">
                  Objetivo de renda passiva: {formatarMoeda(conta.metaMensal)} por mês.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={Boolean(editor)}
        titulo={editor?.id ? "Editar conta" : "Cadastrar conta"}
        descricao={
          editor
            ? NOTAS_FINALIDADE[editor.finalidade]
            : "Saldo é o que tem hoje. Cada conta tem um papel na casa."
        }
        onClose={fechar}
      >
        {editor ? (
          <FormularioModal
            onSubmit={salvar}
            resumo={
              editor.saldo > 0
                ? `Saldo ${formatarMoeda(editor.saldo)} em ${ROTULOS_FINALIDADE[editor.finalidade].toLowerCase()}`
                : `Conta de ${ROTULOS_FINALIDADE[editor.finalidade].toLowerCase()}`
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
                salvar="Salvar conta"
                excluir="Remover conta"
              />
            }
          >
            <CampoTexto
              id="conta-nome"
              label="Nome"
              value={editor.nome}
              placeholder="Ex.: Meta, poupança…"
              autoFocus
              onChange={(nome) => setEditor({ ...editor, nome })}
            />
            {finalidades.length > 1 ? (
              <CampoSelect
                id="conta-finalidade"
                label="Finalidade"
                value={editor.finalidade}
                onChange={(finalidade) =>
                  setEditor({ ...editor, finalidade: finalidade as FinalidadeConta })
                }
              >
                {finalidades.map((finalidade) => (
                  <option key={finalidade} value={finalidade}>
                    {ROTULOS_FINALIDADE[finalidade]}
                  </option>
                ))}
              </CampoSelect>
            ) : null}
            <CampoMoeda
              id="conta-saldo"
              label="Saldo atual"
              value={editor.saldo}
              onChange={(saldo) => setEditor({ ...editor, saldo })}
            />
            {usaMetaEstoque(editor.finalidade) ? (
              <CampoMoeda
                id="conta-meta"
                label="Quanto juntar"
                hint="Viagem, móveis e outros objetivos. Zero se ainda não tem valor."
                value={editor.meta}
                onChange={(meta) => setEditor({ ...editor, meta })}
              />
            ) : null}
            {usaMetaMensal(editor.finalidade) ? (
              <CampoMoeda
                id="conta-meta-mensal"
                label="Renda passiva por mês"
                hint={
                  editor.finalidade === "EMPRESA"
                    ? "Objetivo para reinvestir na empresa todo mês."
                    : "Objetivo para ajudar a pagar as contas. Esse dinheiro investido não sai."
                }
                value={editor.metaMensal}
                onChange={(metaMensal) => setEditor({ ...editor, metaMensal })}
              />
            ) : null}
          </FormularioModal>
        ) : null}
      </Modal>
    </div>
  );
}
