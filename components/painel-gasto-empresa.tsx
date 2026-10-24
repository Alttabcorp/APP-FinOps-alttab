"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  atualizarGastoEmpresaAction,
  excluirGastoEmpresaAction,
  registrarGastoEmpresaAction,
} from "@/app/actions/gasto-empresa";
import { CampoArea, CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMes } from "@/components/campo-mes";
import { CampoMoeda } from "@/components/campo-moeda";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { ContaComProgresso } from "@/lib/application/conta-mapper";
import type { GastoEmpresaDTO, GastoEmpresaPayload } from "@/lib/application/gasto-empresa-mapper";
import {
  competenciaAtual,
  formatarCompetenciaCurta,
  formatarNomeMes,
} from "@/lib/domain/financeiro/competencia";
import { gastosNaCompetencia, totalGastosEmpresa } from "@/lib/domain/financeiro/gasto-empresa";
import { formatarMoeda } from "@/lib/formatacao";

type Rascunho = {
  id?: string;
  nome: string;
  nota: string;
  valor: number;
  competencia: string;
  contaId: string;
};

const rascunhoVazio = (contaId: string): Rascunho => ({
  nome: "",
  nota: "",
  valor: 0,
  competencia: competenciaAtual(),
  contaId,
});

const doGasto = (gasto: GastoEmpresaDTO): Rascunho => ({
  id: gasto.id,
  nome: gasto.nome,
  nota: gasto.nota,
  valor: gasto.valor,
  competencia: gasto.competencia,
  contaId: gasto.contaId,
});

type Props = {
  gastos: GastoEmpresaDTO[];
  contasEmpresa: ContaComProgresso[];
  abrirNovo?: boolean;
};

export function PainelGastoEmpresa({ gastos, contasEmpresa, abrirNovo = false }: Props) {
  const router = useRouter();
  const contaPadrao = contasEmpresa[0]?.id ?? "";
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const mesAtual = competenciaAtual();
  const saiuNoMes = useMemo(
    () => totalGastosEmpresa(gastosNaCompetencia(gastos, mesAtual)),
    [gastos, mesAtual],
  );
  const saldoEmpresa = useMemo(
    () => contasEmpresa.reduce((acc, conta) => acc + conta.saldo, 0),
    [contasEmpresa],
  );
  const contaEscolhida = contasEmpresa.find((conta) => conta.id === editor?.contaId) ?? contasEmpresa[0];

  useEffect(() => {
    if (!abrirNovo) return;
    setErro("");
    setConfirmarExclusao(false);
    setEditor(rascunhoVazio(contaPadrao));
  }, [abrirNovo, contaPadrao]);

  const fechar = () => {
    setEditor(null);
    setConfirmarExclusao(false);
    setErro("");
  };

  const salvar = () => {
    if (!editor) return;
    const payload: GastoEmpresaPayload = {
      id: editor.id,
      nome: editor.nome,
      nota: editor.nota,
      valor: editor.valor,
      competencia: editor.competencia,
      contaId: editor.contaId,
    };
    startTransition(async () => {
      const resposta = editor.id
        ? await atualizarGastoEmpresaAction(payload)
        : await registrarGastoEmpresaAction(payload);
      if (resposta.ok) {
        setStatus(editor.id ? "Anotação atualizada." : "Gasto da empresa registrado.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const excluir = () => {
    if (!editor?.id) return;
    startTransition(async () => {
      const resposta = await excluirGastoEmpresaAction(editor.id as string);
      if (resposta.ok) {
        setStatus("Gasto desfeito. O valor voltou para a empresa.");
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
          <p className="text-sm text-mute">Saiu em {formatarNomeMes(mesAtual)}</p>
          <p className={`amount mt-1 text-[1.85rem] ${saiuNoMes > 0.005 ? "text-outflow" : ""}`}>
            {formatarMoeda(saiuNoMes)}
          </p>
        </div>
        <div className="text-right">
          <button
            className="btn-primary"
            type="button"
            disabled={contasEmpresa.length === 0 || saldoEmpresa < 0.005}
            onClick={() => {
              setErro("");
              setConfirmarExclusao(false);
              setEditor(rascunhoVazio(contaPadrao));
            }}
          >
            Anotar gasto
          </button>
          {saldoEmpresa < 0.005 ? (
            <p className="mt-1 text-xs text-mute">Junte na empresa para anotar uma retirada.</p>
          ) : null}
        </div>
      </div>

      {contasEmpresa.length === 0 ? (
        <p className="vazio mt-8">Cadastre a conta da empresa para anotar o que sai.</p>
      ) : gastos.length === 0 ? (
        <p className="vazio mt-8">Nenhum gasto ainda. Anote a retirada e em que o dinheiro foi gasto.</p>
      ) : (
        <ul className="mt-8 grid gap-5">
          {gastos.map((gasto) => (
            <li key={gasto.id} className="ficha">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight">{gasto.nome}</h3>
                  <p className="mt-1 text-sm text-mute">
                    {formatarCompetenciaCurta(gasto.competencia)}
                    {gasto.contaNome ? ` · saiu de ${gasto.contaNome.toLowerCase()}` : ""}
                  </p>
                </div>
                <button
                  className="btn shrink-0 text-sm"
                  type="button"
                  onClick={() => {
                    setErro("");
                    setConfirmarExclusao(false);
                    setEditor(doGasto(gasto));
                  }}
                >
                  Editar
                </button>
              </header>
              <p className="money mt-3 text-xl font-medium">{formatarMoeda(gasto.valor)}</p>
              {gasto.nota ? <p className="mt-1 max-w-[46ch] text-sm text-mute">{gasto.nota}</p> : null}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={Boolean(editor)}
        titulo={editor?.id ? "Editar gasto da empresa" : "Anotar gasto da empresa"}
        descricao={
          editor?.id
            ? "Dá para mudar o que foi gasto. O valor já saiu da conta."
            : "O valor sai da conta da empresa agora. Anote em que foi gasto."
        }
        onClose={fechar}
      >
        {editor ? (
          <FormularioModal
            onSubmit={salvar}
            resumo={
              editor.id
                ? `Saiu ${formatarMoeda(editor.valor)}. Dá para mudar o que foi gasto.`
                : editor.valor > 0
                  ? `Sai ${formatarMoeda(editor.valor)} da empresa.`
                  : "O valor sai da conta da empresa agora."
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
                salvar={editor.id ? "Salvar anotação" : "Registrar gasto"}
                excluir="Desfazer gasto"
                confirmar="Desfazer e devolver o saldo"
              />
            }
          >
            <CampoTexto
              id="gasto-empresa-nome"
              label="Em que foi gasto"
              value={editor.nome}
              placeholder="Ex.: domínio, caneta, máquina virtual…"
              autoFocus
              onChange={(nome) => setEditor({ ...editor, nome })}
            />
            <CampoArea
              id="gasto-empresa-nota"
              label="Anotação"
              hint="Opcional. Fornecedor, motivo…"
              value={editor.nota}
              placeholder="Detalhe, se quiser…"
              onChange={(nota) => setEditor({ ...editor, nota })}
            />
            {contasEmpresa.length > 1 && !editor.id ? (
              <CampoSelect
                id="gasto-empresa-conta"
                label="De qual conta"
                value={editor.contaId}
                onChange={(contaId) => setEditor({ ...editor, contaId })}
              >
                {contasEmpresa.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} · {formatarMoeda(conta.saldo)}
                  </option>
                ))}
              </CampoSelect>
            ) : null}
            {editor.id ? null : (
              <CampoMoeda
                id="gasto-empresa-valor"
                label="Valor"
                hint={
                  contaEscolhida && contaEscolhida.saldo > 0.005
                    ? `Saldo na empresa: ${formatarMoeda(contaEscolhida.saldo)}.`
                    : "A conta da empresa está zerada. Junte um pouco antes de gastar."
                }
                value={editor.valor}
                onChange={(valor) => setEditor({ ...editor, valor })}
              />
            )}
            <CampoMes
              id="gasto-empresa-mes"
              label="Mês do gasto"
              value={editor.competencia}
              onChange={(competencia) => setEditor({ ...editor, competencia })}
            />
          </FormularioModal>
        ) : null}
      </Modal>
    </div>
  );
}
