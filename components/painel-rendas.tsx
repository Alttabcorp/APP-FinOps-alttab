"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { excluirRendaAction, salvarRendaAction } from "@/app/actions/renda";
import { Bloco } from "@/components/bloco";
import { CampoSelect, CampoTexto } from "@/components/campo";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { FonteRendaDTO, FonteRendaPayload } from "@/lib/application/renda-mapper";
import {
  agruparRendas,
  ROTULOS_TIPO_RENDA,
  TIPOS_RENDA,
  type TipoRenda,
} from "@/lib/domain/financeiro/renda";

type Rascunho = {
  id?: string;
  nome: string;
  tipo: TipoRenda;
};

const rascunhoVazio = (tipo: TipoRenda = "EMPREGO"): Rascunho => ({
  nome: "",
  tipo,
});

type Props = {
  rendas: FonteRendaDTO[];
  abrirNovo?: string | null;
};

export function PainelRendas({ rendas, abrirNovo = null }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const ordenadas = [...rendas].sort((a, b) => a.ordem - b.ordem);
  const grupos = agruparRendas(ordenadas);

  const abrirForm = (rascunho: Rascunho) => {
    setErro("");
    setConfirmarExclusao(false);
    setEditor(rascunho);
    setAberto(true);
  };

  useEffect(() => {
    if (abrirNovo === "rendimento") abrirForm(rascunhoVazio("RENDIMENTO"));
    else if (abrirNovo === "entrada" || abrirNovo === "1") abrirForm(rascunhoVazio("EMPREGO"));
  }, [abrirNovo]);

  const fechar = () => {
    setAberto(false);
    setEditor(null);
    setConfirmarExclusao(false);
    setErro("");
  };

  const salvar = () => {
    if (!editor) return;
    const payload: FonteRendaPayload = {
      id: editor.id,
      nome: editor.nome,
      tipo: editor.tipo,
    };
    startTransition(async () => {
      const resposta = await salvarRendaAction(payload);
      if (resposta.ok) {
        setStatus(editor.id ? "Fonte atualizada." : "Fonte cadastrada.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const excluir = () => {
    if (!editor?.id) return;
    startTransition(async () => {
      const resposta = await excluirRendaAction(editor.id as string);
      if (resposta.ok) {
        setStatus("Fonte removida.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  return (
    <div>
      {grupos.map((grupo) => (
        <Bloco
          key={grupo.id}
          titulo={grupo.rotulo}
          nota={grupo.nota}
          acao={
            grupo.id === "rendimento" ? (
              <button className="btn-primary text-sm" type="button" onClick={() => abrirForm(rascunhoVazio("RENDIMENTO"))}>
                Cadastrar rendimento
              </button>
            ) : grupo.id === "entrada" ? (
              <button className="btn-primary text-sm" type="button" onClick={() => abrirForm(rascunhoVazio("EMPREGO"))}>
                Cadastrar entrada
              </button>
            ) : undefined
          }
        >
          {grupo.itens.length === 0 ? (
            <p className="vazio">Nenhuma cadastrada ainda.</p>
          ) : (
            <ul>
              {grupo.itens.map((renda) => (
                <li
                  key={renda.id}
                  className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{renda.nome}</p>
                    <p className="text-xs text-mute">{ROTULOS_TIPO_RENDA[renda.tipo]}</p>
                  </div>
                  <button className="btn shrink-0 text-sm" type="button" onClick={() => abrirForm(renda)}>
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Bloco>
      ))}

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={aberto && editor !== null}
        titulo={
          editor?.id
            ? "Editar fonte"
            : editor?.tipo === "RENDIMENTO"
              ? "Cadastrar rendimento"
              : "Cadastrar entrada"
        }
        descricao={
          editor?.tipo === "RENDIMENTO"
            ? "Nome da conta que rendeu: poupança, fundo ou meta. O valor do mês se lança no Início."
            : "Só o nome e o tipo. O valor do mês se lança no Início."
        }
        onClose={fechar}
      >
        {editor ? (
          <FormularioModal
            onSubmit={salvar}
            resumo="Depois de salvar, o valor do mês se lança no Início."
            erro={erro}
            acoes={
              <AcoesCadastro
                pendente={pendente}
                podeExcluir={Boolean(editor.id)}
                confirmarExclusao={confirmarExclusao}
                onPedirExclusao={() => setConfirmarExclusao(true)}
                onCancelarExclusao={() => setConfirmarExclusao(false)}
                onExcluir={excluir}
                onVoltar={fechar}
                salvar="Salvar fonte"
                excluir="Remover fonte"
              />
            }
          >
            <CampoTexto
              id="renda-nome"
              label="Nome"
              value={editor.nome}
              placeholder={
                editor.tipo === "RENDIMENTO"
                  ? "Ex.: Rendimento da meta, da poupança, do fundo"
                  : "Ex.: Projeto, bicos…"
              }
              autoFocus
              onChange={(nome) => setEditor({ ...editor, nome })}
            />
            <CampoSelect
              id="renda-tipo"
              label="Como entra"
              value={editor.tipo}
              onChange={(tipo) => setEditor({ ...editor, tipo: tipo as TipoRenda })}
            >
              {TIPOS_RENDA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ROTULOS_TIPO_RENDA[tipo]}
                </option>
              ))}
            </CampoSelect>
          </FormularioModal>
        ) : null}
      </Modal>
    </div>
  );
}
