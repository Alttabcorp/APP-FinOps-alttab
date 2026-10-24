"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  devolverEmprestimoMetaAction,
  excluirEmprestimoMetaAction,
  registrarSaqueMetaAction,
} from "@/app/actions/emprestimo-meta";
import { BarraMeta } from "@/components/barra-meta";
import { CampoLinha, CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMes } from "@/components/campo-mes";
import { CampoMoeda } from "@/components/campo-moeda";
import { CampoPassos } from "@/components/campo-passos";
import { FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { ContaComProgresso } from "@/lib/application/conta-mapper";
import type { EmprestimoMetaComSituacao } from "@/lib/application/emprestimo-meta-mapper";
import { valorDaParcela } from "@/lib/domain/financeiro/cartao";
import {
  competenciaAtual,
  formatarCompetenciaCurta,
} from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

type Rascunho = {
  nome: string;
  valorTotal: number;
  parcelas: number;
  competenciaInicio: string;
  contaId: string;
};

const rascunhoVazio = (contaId: string): Rascunho => ({
  nome: "",
  valorTotal: 0,
  parcelas: 6,
  competenciaInicio: competenciaAtual(),
  contaId,
});

type Props = {
  emprestimos: EmprestimoMetaComSituacao[];
  contasMeta: ContaComProgresso[];
  abrirNovo?: boolean;
};

export function PainelEmprestimoMeta({ emprestimos, contasMeta, abrirNovo = false }: Props) {
  const router = useRouter();
  const contaPadrao = contasMeta[0]?.id ?? "";
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [devolverId, setDevolverId] = useState<string | null>(null);
  const [valorDevolucao, setValorDevolucao] = useState(0);
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const aberto = useMemo(
    () => emprestimos.reduce((acc, emprestimo) => acc + emprestimo.aberto, 0),
    [emprestimos],
  );
  const contaEscolhida = contasMeta.find((conta) => conta.id === editor?.contaId) ?? contasMeta[0];
  const saldoMeta = contaEscolhida?.saldo ?? 0;
  const emprestimoDevolucao = emprestimos.find((emprestimo) => emprestimo.id === devolverId);

  useEffect(() => {
    if (!abrirNovo) return;
    setErro("");
    setEditor(rascunhoVazio(contaPadrao));
  }, [abrirNovo, contaPadrao]);

  const fechar = () => {
    setEditor(null);
    setDevolverId(null);
    setConfirmarExclusao(null);
    setErro("");
  };

  const registrar = () => {
    if (!editor) return;
    startTransition(async () => {
      const resposta = await registrarSaqueMetaAction(editor);
      if (resposta.ok) {
        setStatus("Saque da meta registrado. Você ficou devendo para si.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const devolver = () => {
    if (!devolverId) return;
    startTransition(async () => {
      const resposta = await devolverEmprestimoMetaAction({ id: devolverId, valor: valorDevolucao });
      if (resposta.ok) {
        setStatus(resposta.emprestimo?.quitado ? "Voltou tudo para a meta." : "Devolução registrada.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const excluir = (id: string) => {
    startTransition(async () => {
      const resposta = await excluirEmprestimoMetaAction(id);
      if (resposta.ok) {
        setStatus("Compra à vista removida.");
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
          <p className="text-sm text-mute">Você deve à meta</p>
          <p className={`amount mt-1 text-[1.85rem] ${aberto > 0.005 ? "text-outflow" : "text-inflow"}`}>
            {formatarMoeda(aberto)}
          </p>
        </div>
        <div className="text-right">
          <button
            className="btn-primary"
            type="button"
            disabled={contasMeta.length === 0 || saldoDisponivel(contasMeta) < 0.005}
            onClick={() => {
              setErro("");
              setEditor(rascunhoVazio(contaPadrao));
            }}
          >
            Comprar com a meta
          </button>
          {saldoDisponivel(contasMeta) < 0.005 ? (
            <p className="mt-1 text-xs text-mute">Junte na meta para sacar à vista.</p>
          ) : null}
        </div>
      </div>

      {contasMeta.length === 0 ? (
        <p className="vazio mt-8">Cadastre a conta da meta para sacar à vista.</p>
      ) : emprestimos.length === 0 ? (
        <p className="vazio mt-8">
          Nada devido. Quando sacar da meta para pagar à vista, a dívida consigo aparece aqui.
        </p>
      ) : (
        <ul className="mt-8 grid gap-5">
          {emprestimos.map((emprestimo) => (
            <li key={emprestimo.id} className="ficha">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight">{emprestimo.nome}</h3>
                  <p className="mt-1 text-sm text-mute">
                    Saiu {formatarMoeda(emprestimo.valorTotal)} da {emprestimo.contaNome.toLowerCase()} ·{" "}
                    {emprestimo.parcelas}x de {formatarMoeda(emprestimo.valorParcela)}
                  </p>
                </div>
                {emprestimo.quitado ? null : (
                  <button
                    className="btn shrink-0 text-sm"
                    type="button"
                    onClick={() => {
                      setErro("");
                      setDevolverId(emprestimo.id);
                      setValorDevolucao(
                        emprestimo.parcelaSugerida > 0.005 ? emprestimo.parcelaSugerida : emprestimo.aberto,
                      );
                    }}
                  >
                    Devolver
                  </button>
                )}
              </header>
              {emprestimo.quitado ? (
                <p className="mt-3 text-sm text-inflow">Voltou para a meta.</p>
              ) : (
                <>
                  <p className="money mt-3 text-xl font-medium">{formatarMoeda(emprestimo.aberto)}</p>
                  <p className="mt-1 text-sm text-mute">
                    {emprestimo.parcelaSugerida > 0.005
                      ? `Este mês devolve ${formatarMoeda(emprestimo.parcelaSugerida)} · restam ${emprestimo.parcelasRestantes}`
                      : `Adiantado neste mês · restam ${emprestimo.parcelasRestantes} ${emprestimo.parcelasRestantes === 1 ? "parcela" : "parcelas"}`}
                  </p>
                  <div className="mt-3">
                    <BarraMeta nome={`devolução ${emprestimo.nome}`} progresso={emprestimo.progresso} />
                  </div>
                </>
              )}
              <p className="mt-2">
                {confirmarExclusao === emprestimo.id ? (
                  <span className="flex flex-wrap gap-2">
                    <button className="btn text-sm" type="button" onClick={() => setConfirmarExclusao(null)}>
                      Manter
                    </button>
                    <button
                      className="btn-danger text-sm"
                      type="button"
                      disabled={pendente}
                      onClick={() => excluir(emprestimo.id)}
                    >
                      {pendente
                        ? "Removendo…"
                        : emprestimo.pagoTotal < 0.005
                          ? "Desfazer e devolver o saldo"
                          : "Esquecer o resto da dívida"}
                    </button>
                  </span>
                ) : (
                  <button
                    className="text-sm text-mute hover:underline"
                    type="button"
                    onClick={() => setConfirmarExclusao(emprestimo.id)}
                  >
                    {emprestimo.pagoTotal < 0.005 ? "Desfazer saque" : "Esquecer o resto"}
                  </button>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={Boolean(editor)}
        titulo="Comprar com a meta"
        descricao="O valor sai da meta agora. Você fica devendo para si e devolve aos poucos, sem usar o cartão."
        onClose={fechar}
      >
        {editor ? (
          <FormularioModal
            onSubmit={registrar}
            resumo={
              editor.valorTotal > 0 && editor.parcelas > 0
                ? `Sai ${formatarMoeda(editor.valorTotal)} agora · devolve ${editor.parcelas}x de ${formatarMoeda(valorDaParcela(editor.valorTotal, editor.parcelas, 0))}`
                : "O valor sai da meta. Você devolve aos poucos."
            }
            erro={erro}
            acoes={
              <button className="btn-primary ml-auto" type="submit" disabled={pendente}>
                {pendente ? "Registrando…" : "Sacar e ficar devendo"}
              </button>
            }
          >
            <CampoTexto
              id="saque-nome"
              label="O que vai comprar"
              value={editor.nome}
              placeholder="Ex.: Sofá, mesa…"
              autoFocus
              onChange={(nome) => setEditor({ ...editor, nome })}
            />
            {contasMeta.length > 1 ? (
              <CampoSelect
                id="saque-conta"
                label="De qual meta"
                value={editor.contaId}
                onChange={(contaId) => setEditor({ ...editor, contaId })}
              >
                {contasMeta.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} · {formatarMoeda(conta.saldo)}
                  </option>
                ))}
              </CampoSelect>
            ) : null}
            <CampoLinha>
              <CampoMoeda
                id="saque-total"
                label="Valor à vista"
                hint={
                  saldoMeta > 0.005
                    ? `Saldo na meta: ${formatarMoeda(saldoMeta)}.`
                    : "A meta está zerada. Junte um pouco antes de sacar."
                }
                value={editor.valorTotal}
                onChange={(valorTotal) => setEditor({ ...editor, valorTotal })}
              />
              <CampoPassos
                id="saque-parcelas"
                label="Devolve em"
                value={editor.parcelas}
                min={1}
                max={48}
                onChange={(parcelas) => setEditor({ ...editor, parcelas })}
                detalhe={editor.parcelas === 1 ? "1 mês" : `${editor.parcelas} meses`}
              />
            </CampoLinha>
            <CampoMes
              id="saque-inicio"
              label="Primeira devolução"
              value={editor.competenciaInicio}
              onChange={(competenciaInicio) => setEditor({ ...editor, competenciaInicio })}
            />
          </FormularioModal>
        ) : null}
      </Modal>

      <Modal
        aberto={Boolean(emprestimoDevolucao)}
        titulo="Devolver à meta"
        descricao={
          emprestimoDevolucao
            ? `Ainda deve ${formatarMoeda(emprestimoDevolucao.aberto)} do ${emprestimoDevolucao.nome.toLowerCase()}.`
            : undefined
        }
        onClose={fechar}
      >
        {emprestimoDevolucao ? (
          <FormularioModal
            onSubmit={devolver}
            resumo={`Ainda deve ${formatarMoeda(emprestimoDevolucao.aberto)}. Já voltou ${formatarMoeda(emprestimoDevolucao.pagoTotal)}.`}
            erro={erro}
            acoes={
              <>
                {emprestimoDevolucao.aberto > valorDevolucao + 0.005 ? (
                  <button
                    className="btn-link"
                    type="button"
                    onClick={() => setValorDevolucao(emprestimoDevolucao.aberto)}
                  >
                    Quitar tudo
                  </button>
                ) : (
                  <span />
                )}
                <button className="btn-primary" type="submit" disabled={pendente}>
                  {pendente ? "Devolvendo…" : "Devolver à meta"}
                </button>
              </>
            }
          >
            <CampoMoeda
              id="devolucao-valor"
              label="Quanto volta agora"
              hint={
                emprestimoDevolucao.parcelaSugerida > 0.005
                  ? `Parcela deste mês: ${formatarMoeda(emprestimoDevolucao.parcelaSugerida)}.`
                  : "Pode devolver o que couber neste mês."
              }
              value={valorDevolucao}
              onChange={setValorDevolucao}
            />
            <p className="text-sm text-mute">Começou em {formatarCompetenciaCurta(emprestimoDevolucao.competenciaInicio)}.</p>
          </FormularioModal>
        ) : null}
      </Modal>
    </div>
  );
}

const saldoDisponivel = (contas: ContaComProgresso[]) =>
  contas.reduce((acc, conta) => acc + conta.saldo, 0);
