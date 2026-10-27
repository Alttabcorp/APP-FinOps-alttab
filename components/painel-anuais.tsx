"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { excluirContaAnualAction, salvarContaAnualAction } from "@/app/actions/anual";
import { CampoLinha, CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { CampoPassos } from "@/components/campo-passos";
import { Bloco } from "@/components/bloco";
import { AcoesCadastro, FormularioModal } from "@/components/formulario-modal";
import { Modal } from "@/components/modal";
import type { ContaAnualDTO, ContaAnualPayload } from "@/lib/application/anual-mapper";
import {
  agruparContasAnuais,
  formatarDataCobranca,
  formatarMesCalendario,
  formatarPeriodoAnual,
  LADOS_CONTA_ANUAL,
  parcelaAnualNaCompetencia,
  ROTULOS_LADO_ANUAL,
  sugerirReservaMensal,
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
  banco: string;
  chavePix: string;
};

const diaHoje = () => Math.min(31, Math.max(1, new Date().getDate()));

const rascunhoVazio = (): Rascunho => {
  const mes = Number(competenciaAtual().slice(5));
  return {
    nome: "",
    valor: 0,
    dia: diaHoje(),
    mes,
    parcelas: sugerirReservaMensal(0, mes, competenciaAtual()).meses,
    lado: "CASA",
    banco: "",
    chavePix: "",
  };
};

type Props = {
  contas: ContaAnualDTO[];
  lado?: LadoContaAnual;
  abrirNovo?: boolean;
  titulo?: string;
  nota?: string;
};

export function PainelAnuais({ contas, lado, abrirNovo = false, titulo, nota }: Props) {
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
    const vazio = rascunhoVazio();
    setEditor({
      ...vazio,
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
      banco: editor.banco,
      chavePix: editor.chavePix,
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

  const aplicarReserva = (conta: ContaAnualDTO) => {
    const reserva = sugerirReservaMensal(conta.valor, conta.mes, mesAtual);
    startTransition(async () => {
      const resposta = await salvarContaAnualAction({
        id: conta.id,
        nome: conta.nome,
        valor: conta.valor,
        dia: conta.dia,
        mes: conta.mes,
        parcelas: reserva.meses,
        lado: conta.lado,
        banco: conta.banco,
        chavePix: conta.chavePix,
      });
      if (resposta.ok) {
        setStatus(
          reserva.caiNesteMes
            ? "Cai neste mês: o valor inteiro entra na nota."
            : `Vão separar ${formatarMoeda(reserva.valorMes)} por mês até a cobrança.`,
        );
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
    <Bloco
      titulo={titulo}
      nota={nota}
      figura={
        <>
          <p className="bloco-figura-rotulo">Cai neste mês</p>
          <p className="amount">{formatarMoeda(desteMes)}</p>
        </>
      }
      acao={
        <button
          className="btn-primary"
          type="button"
          onClick={() => abrir({ ...rascunhoVazio(), lado: lado ?? "CASA" })}
        >
          Cadastrar conta anual
        </button>
      }
    >
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {grupos.map((grupo) => (
        <section key={grupo.lado} className={lado ? undefined : "mt-2"}>
          {lado ? null : <h2 className="titulo-secao">{grupo.rotulo}</h2>}
          {grupo.itens.length === 0 ? (
            <p className="vazio">
              {grupo.lado === "EMPRESA"
                ? "Domínio, máquina virtual e o que a empresa paga uma vez no ano."
                : "IPTU, IPVA e o que a casa paga uma vez no ano."}
            </p>
          ) : (
            <ul className="grid gap-3">
              {grupo.itens.map((conta) => {
                const parcela = parcelaAnualNaCompetencia(conta, mesAtual);
                const reserva = sugerirReservaMensal(conta.valor, conta.mes, mesAtual);
                const podeSugerir = conta.parcelas !== reserva.meses;
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
                      {conta.banco || conta.chavePix ? (
                        <p className="mt-1 text-xs text-mute">
                          {[conta.banco, conta.chavePix ? `PIX ${conta.chavePix}` : ""].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      {podeSugerir && reserva.valorMes > 0.005 ? (
                        <p className="mt-2 text-sm">
                          {reserva.caiNesteMes
                            ? `Sugestão: o valor inteiro neste mês, ${formatarMoeda(conta.valor)}.`
                            : `Sugestão: ${formatarMoeda(reserva.valorMes)} por mês até ${formatarDataCobranca(conta.dia, conta.mes)}, para no dia do pagamento o valor já estar junto.`}
                          <button
                            className="btn-link ml-1"
                            type="button"
                            disabled={pendente}
                            onClick={() => aplicarReserva(conta)}
                          >
                            Separar por mês
                          </button>
                        </p>
                      ) : null}
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
                          banco: conta.banco,
                          chavePix: conta.chavePix,
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
        descricao="Informe o valor e quando cobra. O sistema sugere guardar um pedaço todo mês, para no dia do pagamento o valor já estar junto."
        onClose={fechar}
      >
        {editor ? (
          <FormularioModal
            onSubmit={salvar}
            resumo={textoSugestaoReserva(editor, mesAtual)}
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
                onChange={(mes) => {
                  const proximo = Number(mes);
                  setEditor({
                    ...editor,
                    mes: proximo,
                    parcelas: editor.id
                      ? editor.parcelas
                      : sugerirReservaMensal(editor.valor, proximo, mesAtual).meses,
                  });
                }}
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
              label="Meses para juntar"
              value={editor.parcelas}
              min={1}
              max={12}
              onChange={(parcelas) => setEditor({ ...editor, parcelas })}
              detalhe={formatarPeriodoAnual(editor.mes, editor.parcelas, editor.dia)}
            />
            {sugerirReservaMensal(editor.valor, editor.mes, mesAtual).meses !== editor.parcelas ? (
              <button
                className="btn-link justify-self-start"
                type="button"
                onClick={() =>
                  setEditor({
                    ...editor,
                    parcelas: sugerirReservaMensal(editor.valor, editor.mes, mesAtual).meses,
                  })
                }
              >
                Usar a sugestão até a cobrança
              </button>
            ) : null}
            {sugerirReservaMensal(editor.valor, editor.mes, mesAtual).caiNesteMes ? (
              <button
                className="btn-link justify-self-start"
                type="button"
                onClick={() => setEditor({ ...editor, parcelas: 12 })}
              >
                Juntar para o próximo ano (12 meses)
              </button>
            ) : null}
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
            <CampoTexto
              id="anual-banco"
              label="Banco da caixinha"
              hint="Opcional."
              value={editor.banco}
              placeholder="Ex.: Nubank"
              onChange={(banco) => setEditor({ ...editor, banco })}
            />
            <CampoTexto
              id="anual-chave"
              label="Chave PIX"
              hint="Opcional. Uma caixinha por conta anual."
              value={editor.chavePix}
              placeholder="CPF, e-mail, telefone ou aleatória"
              onChange={(chavePix) => setEditor({ ...editor, chavePix })}
            />
          </FormularioModal>
        ) : null}
      </Modal>
    </Bloco>
  );
}

function textoSugestaoReserva(editor: Rascunho, competencia: string) {
  const cobranca = formatarDataCobranca(editor.dia, editor.mes);
  if (editor.valor < 0.005) {
    return `Cobra ${cobranca}. Quando informarem o valor, o sistema sugere quanto guardar por mês.`;
  }
  const reserva = sugerirReservaMensal(editor.valor, editor.mes, competencia);
  const valorMes = valorParcelaAnual(editor.valor, editor.parcelas, 0);
  if (editor.parcelas <= 1) {
    return reserva.caiNesteMes
      ? `Cai neste mês: ${formatarMoeda(editor.valor)} no dia do pagamento.`
      : `Cobra ${cobranca}. Sugestão: ${formatarMoeda(reserva.valorMes)} por mês até lá.`;
  }
  return `Separam ${formatarMoeda(valorMes)} por mês até ${cobranca}. No dia do pagamento o valor já está junto.`;
}
