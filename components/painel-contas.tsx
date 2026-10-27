"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { excluirContaAction, salvarContaAction } from "@/app/actions/conta";
import { BarraMeta } from "@/components/barra-meta";
import { CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { Bloco } from "@/components/bloco";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { ContaComProgresso, ContaPayload } from "@/lib/application/conta-mapper";
import {
  FINALIDADES_CONTA,
  NOTAS_FINALIDADE,
  ROTULOS_FINALIDADE,
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
  banco: string;
  titular: string;
  chavePix: string;
  recebePoupanca: boolean;
};

const rascunhoVazio = (): Rascunho => ({
  nome: "",
  finalidade: "META",
  saldo: 0,
  meta: 0,
  metaMensal: 0,
  banco: "",
  titular: "",
  chavePix: "",
  recebePoupanca: false,
});

const daConta = (conta: ContaComProgresso): Rascunho => ({
  id: conta.id,
  nome: conta.nome,
  finalidade: conta.finalidade,
  saldo: conta.saldo,
  meta: conta.meta ?? 0,
  metaMensal: conta.metaMensal ?? 0,
  banco: conta.banco,
  titular: conta.titular,
  chavePix: conta.chavePix,
  recebePoupanca: conta.recebePoupanca,
});

type Props = {
  contas: ContaComProgresso[];
  finalidades?: FinalidadeConta[];
  finalidadePadrao?: FinalidadeConta;
  abrirNovo?: boolean;
  vazio?: string;
  titulo?: string;
  nota?: string;
  rotuloTotal?: string;
};

export function PainelContas({
  contas,
  finalidades = [...FINALIDADES_CONTA],
  finalidadePadrao,
  abrirNovo = false,
  vazio = "Nenhuma conta ainda. Cadastre poupança, reserva, meta, investimento ou empresa.",
  titulo,
  nota,
  rotuloTotal = "Nas contas",
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
    setEditor({ ...rascunhoVazio(), finalidade: padrao });
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
      banco: editor.banco,
      titular: editor.titular,
      chavePix: editor.chavePix,
      recebePoupanca: editor.recebePoupanca,
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

  const detalheConta = (conta: ContaComProgresso) => {
    const partes: string[] = [];
    if (ROTULOS_FINALIDADE[conta.finalidade] !== conta.nome) {
      partes.push(ROTULOS_FINALIDADE[conta.finalidade]);
    }
    if (conta.banco) partes.push(conta.banco);
    if (conta.titular) partes.push(conta.titular);
    if (conta.chavePix) partes.push(`PIX ${conta.chavePix}`);
    if (conta.recebePoupanca) partes.push("recebe os 10% da poupança");
    return partes.join(" · ");
  };

  return (
    <Bloco
      titulo={titulo}
      nota={nota}
      figura={
        <>
          <p className="bloco-figura-rotulo">{rotuloTotal}</p>
          <p className="amount">{formatarMoeda(total)}</p>
        </>
      }
      acao={
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
      }
    >
      {contas.length === 0 ? (
        <p className="vazio">{vazio}</p>
      ) : (
        <ul className="grid gap-3">
          {contas.map((conta) => {
            const detalhe = detalheConta(conta);
            return (
              <li key={conta.id} className="ficha ficha-linha">
                <div className="ficha-topo">
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-tight text-pretty">{conta.nome}</h3>
                    {detalhe ? <p className="mt-1 text-sm text-mute">{detalhe}</p> : null}
                    {conta.metaMensal && conta.metaMensal > 0.005 ? (
                      <p className="mt-1 text-sm text-mute">
                        Renda passiva: {formatarMoeda(conta.metaMensal)} por mês
                      </p>
                    ) : null}
                  </div>
                  <div className="ficha-valor">
                    <p className="amount text-[1.35rem]">{formatarMoeda(conta.saldo)}</p>
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
                  </div>
                </div>
                {conta.progresso.temMeta ? (
                  <BarraMeta nome={conta.nome} progresso={conta.progresso} />
                ) : null}
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
            <CampoTexto
              id="conta-banco"
              label="Banco"
              hint="Opcional. PicPay, Nubank…"
              value={editor.banco}
              placeholder="Ex.: PicPay"
              onChange={(banco) => setEditor({ ...editor, banco })}
            />
            <CampoTexto
              id="conta-titular"
              label="Titular"
              hint="Opcional."
              value={editor.titular}
              placeholder="Ex.: Glaymar"
              onChange={(titular) => setEditor({ ...editor, titular })}
            />
            <CampoTexto
              id="conta-chave"
              label="Chave PIX"
              hint="Opcional. O PIX continua no app do banco; aqui só copia a chave."
              value={editor.chavePix}
              placeholder="CPF, e-mail, telefone ou aleatória"
              onChange={(chavePix) => setEditor({ ...editor, chavePix })}
            />
            <label className="flex cursor-pointer items-start gap-3" htmlFor="conta-poupanca">
              <input
                id="conta-poupanca"
                className="checkbox mt-0.5"
                type="checkbox"
                checked={editor.recebePoupanca}
                onChange={(evento) => setEditor({ ...editor, recebePoupanca: evento.target.checked })}
              />
              <span>
                <span className="block text-sm">Recebe os 10% da poupança</span>
                <span className="block text-xs text-mute">Uma conta só. Marquem se o 10% cai nesta chave.</span>
              </span>
            </label>
          </FormularioModal>
        ) : null}
      </Modal>
    </Bloco>
  );
}
