"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { excluirRendaAction, salvarRendaAction } from "@/app/actions/renda";
import { CampoSelect, CampoTexto } from "@/components/campo";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { FonteRendaDTO, FonteRendaPayload } from "@/lib/application/renda-mapper";
import { ROTULOS_TIPO_RENDA, TIPOS_RENDA, type TipoRenda } from "@/lib/domain/financeiro/renda";

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
  const nomes = ordenadas.map((renda) => renda.nome).filter(Boolean);

  const abrirLista = () => {
    setEditor(null);
    setErro("");
    setConfirmarExclusao(false);
    setAberto(true);
  };

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

  const voltarLista = () => {
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
        voltarLista();
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
        voltarLista();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  return (
    <section className="panel p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Fontes</h2>
          <p className="mt-1 text-sm text-mute">
            {nomes.length === 0
              ? "Nenhuma cadastrada ainda."
              : nomes.length <= 4
                ? nomes.join(", ")
                : `${nomes.slice(0, 3).join(", ")} e mais ${nomes.length - 3}.`}
          </p>
        </div>
        <button className="btn-primary shrink-0 text-sm" type="button" onClick={abrirLista}>
          Gerenciar
        </button>
      </header>

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={aberto}
        titulo={
          editor
            ? editor.id
              ? "Editar fonte"
              : editor.tipo === "RENDIMENTO"
                ? "Cadastrar rendimento"
                : "Cadastrar entrada"
            : "Fontes"
        }
        descricao={
          editor
            ? "Só o nome e o tipo. Depois informe o valor do mês nos blocos da página."
            : "O valor de cada mês se informa em Dinheiro ou em Vales e rendimento."
        }
        onClose={fechar}
        largura={editor ? "md" : "lg"}
      >
        {editor ? (
          <FormularioModal
            onSubmit={salvar}
            resumo="Depois de salvar, altere o valor do mês na página."
            erro={erro}
            acoes={
              <AcoesCadastro
                pendente={pendente}
                podeExcluir={Boolean(editor.id)}
                confirmarExclusao={confirmarExclusao}
                onPedirExclusao={() => setConfirmarExclusao(true)}
                onCancelarExclusao={() => setConfirmarExclusao(false)}
                onExcluir={excluir}
                onVoltar={voltarLista}
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
                editor.tipo === "RENDIMENTO" ? "Ex.: Rendimento da poupança" : "Ex.: Projeto, bicos…"
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
        ) : (
          <div className="form-modal">
            <p className="form-resumo">
              {ordenadas.length === 0
                ? "Nenhuma fonte ainda."
                : `${ordenadas.length} ${ordenadas.length === 1 ? "fonte" : "fontes"}.`}
            </p>
            {ordenadas.length > 0 ? (
              <ul className="form-campos">
                {ordenadas.map((renda) => (
                  <li key={renda.id} className="flex items-center justify-between gap-3 border-t border-line py-2.5">
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
            ) : null}
            <div className="form-acoes">
              <span />
              <button className="btn-primary" type="button" onClick={() => abrirForm(rascunhoVazio("EMPREGO"))}>
                Cadastrar fonte
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
