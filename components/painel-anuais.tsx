"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { excluirContaAnualAction, salvarContaAnualAction } from "@/app/actions/anual";
import { CampoLinha, CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { CampoPassos } from "@/components/campo-passos";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { ContaAnualDTO, ContaAnualPayload } from "@/lib/application/anual-mapper";
import {
  agruparContasAnuais,
  formatarDataCobranca,
  formatarMesCalendario,
  formatarPeriodoAnual,
  LADOS_CONTA_ANUAL,
  mesesAteCobranca,
  parcelaAnualNaCompetencia,
  ROTULOS_LADO_ANUAL,
  valorParcelaAnual,
  type LadoContaAnual,
} from "@/lib/domain/financeiro/anual";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

type Rascunho = {
  id?: string;
  nome: string;
  valor: number;
  dia: number;
  mes: number;
  parcelas: number;
  lado: LadoContaAnual;
};

const diaHoje = () => Math.min(31, Math.max(1, new Date().getDate()));

const rascunhoVazio = (): Rascunho => ({
  nome: "",
  valor: 0,
  dia: diaHoje(),
  mes: Number(competenciaAtual().slice(5)),
  parcelas: 1,
  lado: "CASA",
});

type Props = {
  contas: ContaAnualDTO[];
  lado?: LadoContaAnual;
  abrirNovo?: boolean;
};

export function PainelAnuais({ contas, lado, abrirNovo = false }: Props) {
  const router = useRouter();
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const mesAtual = competenciaAtual();
  const grupos = agruparContasAnuais(contas).filter((grupo) => !lado || grupo.lado === lado);

  useEffect(() => {
    if (!abrirNovo) return;
    setErro("");
    setConfirmarExclusao(false);
    setEditor({
      nome: "",
      valor: 0,
      dia: diaHoje(),
      mes: Number(competenciaAtual().slice(5)),
      parcelas: 1,
      lado: lado ?? "CASA",
    });
  }, [abrirNovo, lado]);
  const desteMes = useMemo(
    () =>
      contas
        .map((conta) => parcelaAnualNaCompetencia(conta, mesAtual))
        .filter((parcela) => parcela != null)
        .reduce((acc, parcela) => acc + parcela.valor, 0),
    [contas, mesAtual],
  );

  const abrir = (rascunho: Rascunho) => {
    setErro("");
    setConfirmarExclusao(false);
    setEditor(rascunho);
  };

  const fechar = () => {
    setEditor(null);
    setConfirmarExclusao(false);
    setErro("");
  };

  const salvar = () => {
    if (!editor) return;
    const payload: ContaAnualPayload = {
      id: editor.id,
      nome: editor.nome,
      valor: editor.valor,
      dia: editor.dia,
      mes: editor.mes,
      parcelas: editor.parcelas,
      lado: editor.lado,
    };
    startTransition(async () => {
      const resposta = await salvarContaAnualAction(payload);
      if (resposta.ok) {
        setStatus(editor.id ? "Conta anual atualizada." : "Conta anual cadastrada.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const excluir = () => {
    if (!editor?.id) return;
    startTransition(async () => {
      const resposta = await excluirContaAnualAction(editor.id as string);
      if (resposta.ok) {
        setStatus("Conta anual removida.");
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
          <p className="text-sm text-mute">Cai neste mês</p>
          <p className="amount mt-1 text-[1.85rem]">{formatarMoeda(desteMes)}</p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => abrir({ ...rascunhoVazio(), lado: lado ?? "CASA" })}
        >
          Cadastrar conta anual
        </button>
      </div>

      {grupos.map((grupo) => (
        <section key={grupo.lado} className="mt-8">
          {lado ? null : <h2 className="titulo-secao">{grupo.rotulo}</h2>}
          {grupo.itens.length === 0 ? (
            <p className="vazio mt-3">
              {grupo.lado === "EMPRESA"
                ? "Domínio, máquina virtual e o que a empresa paga uma vez no ano."
                : "IPTU, IPVA e o que a casa paga uma vez no ano."}
            </p>
          ) : (
            <ul className="mt-3 grid gap-4">
              {grupo.itens.map((conta) => {
                const parcela = parcelaAnualNaCompetencia(conta, mesAtual);
                return (
                  <li key={conta.id} className="ficha flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{conta.nome}</p>
                      <p className="mt-1 text-sm text-mute">
                        {formatarMoeda(conta.valor)} · {formatarPeriodoAnual(conta.mes, conta.parcelas, conta.dia)}
                        {conta.parcelas > 1 ? ` · ${conta.parcelas}x de ${formatarMoeda(conta.valorParcela)}` : null}
                      </p>
                      <p className="mt-1 text-xs text-mute">
                        {parcela
                          ? `Neste mês: ${formatarMoeda(parcela.valor)}${
                              parcela.total > 1 ? ` (${parcela.atual}/${parcela.total})` : ""
                            }${
                              parcela.atual === parcela.total
                                ? ` · cobra ${formatarDataCobranca(conta.dia, conta.mes)}`
                                : ""
                            }`
                          : `Não cai neste mês · cobra ${formatarDataCobranca(conta.dia, conta.mes)}`}
                      </p>
                    </div>
                    <button
                      className="btn shrink-0 text-sm"
                      type="button"
                      onClick={() =>
                        abrir({
                          id: conta.id,
                          nome: conta.nome,
                          valor: conta.valor,
                          dia: conta.dia,
                          mes: conta.mes,
                          parcelas: conta.parcelas,
                          lado: conta.lado,
                        })
                      }
                    >
                      Editar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}

      <p className="mt-6 text-xs text-mute" aria-live="polite">
        {status}
      </p>

      <Modal
        aberto={Boolean(editor)}
        titulo={editor?.id ? "Editar conta anual" : "Cadastrar conta anual"}
        descricao="Informe quando cobra. Dá para dividir o valor nos meses até essa data."
        onClose={fechar}
      >
        {editor ? (
          <FormularioModal
            onSubmit={salvar}
            resumo={
              editor.parcelas > 1 && editor.valor > 0
                ? `${formatarPeriodoAnual(editor.mes, editor.parcelas, editor.dia)} · ${editor.parcelas}x de ${formatarMoeda(valorParcelaAnual(editor.valor, editor.parcelas, 0))}`
                : `Cobra ${formatarDataCobranca(editor.dia, editor.mes)}.`
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
                salvar="Salvar conta anual"
                excluir="Remover conta"
              />
            }
          >
            <CampoTexto
              id="anual-nome"
              label="Nome"
              value={editor.nome}
              placeholder="Ex.: IPTU, IPVA, domínio…"
              autoFocus
              onChange={(nome) => setEditor({ ...editor, nome })}
            />
            <CampoMoeda
              id="anual-valor"
              label="Valor no ano"
              value={editor.valor}
              onChange={(valor) => setEditor({ ...editor, valor })}
            />
            <CampoLinha>
              <CampoPassos
                id="anual-dia"
                label="Dia da cobrança"
                value={editor.dia}
                min={1}
                max={31}
                onChange={(dia) => setEditor({ ...editor, dia })}
              />
              <CampoSelect
                id="anual-mes"
                label="Mês da cobrança"
                value={String(editor.mes)}
                onChange={(mes) => setEditor({ ...editor, mes: Number(mes) })}
              >
                {Array.from({ length: 12 }, (_, indice) => indice + 1).map((mes) => (
                  <option key={mes} value={mes}>
                    {formatarMesCalendario(mes)}
                  </option>
                ))}
              </CampoSelect>
            </CampoLinha>
            <CampoPassos
              id="anual-parcelas"
              label="Parcelas até a cobrança"
              value={editor.parcelas}
              min={1}
              max={12}
              onChange={(parcelas) => setEditor({ ...editor, parcelas })}
              detalhe={formatarPeriodoAnual(editor.mes, editor.parcelas, editor.dia)}
            />
            <button
              className="btn-link justify-self-start"
              type="button"
              onClick={() =>
                setEditor({
                  ...editor,
                  parcelas: mesesAteCobranca(competenciaAtual(), editor.mes) || 1,
                })
              }
            >
              Usar os meses que faltam
            </button>
            {lado ? null : (
              <CampoSelect
                id="anual-lado"
                label="De quem é"
                value={editor.lado}
                onChange={(proximo) => setEditor({ ...editor, lado: proximo as LadoContaAnual })}
              >
                {LADOS_CONTA_ANUAL.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {ROTULOS_LADO_ANUAL[opcao]}
                  </option>
                ))}
              </CampoSelect>
            )}
          </FormularioModal>
        ) : null}
      </Modal>
    </div>
  );
}
