"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  devolverEmprestimoMetaAction,
  excluirEmprestimoMetaAction,
  registrarSaqueMetaAction,
} from "@/app/actions/emprestimo-meta";
import { Bloco } from "@/components/bloco";
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
import type { FinalidadeConta } from "@/lib/domain/financeiro/conta";
import { ROTULOS_FINALIDADE } from "@/lib/domain/financeiro/conta";
import { avaliarReposicao, sugerirParcelasReposicao } from "@/lib/domain/financeiro/emprestimo-meta";
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
  parcelas: 1,
  competenciaInicio: competenciaAtual(),
  contaId,
});

type Props = {
  emprestimos: EmprestimoMetaComSituacao[];
  contas: ContaComProgresso[];
  sobraMes: number;
  abrirNovo?: boolean;
  titulo?: string;
  nota?: string;
};

export function PainelEmprestimoMeta({
  emprestimos,
  contas,
  sobraMes,
  abrirNovo = false,
  titulo,
  nota,
}: Props) {
  const router = useRouter();
  const contaPadrao = contas[0]?.id ?? "";
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [devolverId, setDevolverId] = useState<string | null>(null);
  const [valorDevolucao, setValorDevolucao] = useState(0);
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null);
  const [confirmarAperto, setConfirmarAperto] = useState(false);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const aberto = useMemo(
    () => emprestimos.reduce((acc, emprestimo) => acc + emprestimo.aberto, 0),
    [emprestimos],
  );
  const contaEscolhida = contas.find((conta) => conta.id === editor?.contaId) ?? contas[0];
  const saldoConta = contaEscolhida?.saldo ?? 0;
  const emprestimoDevolucao = emprestimos.find((emprestimo) => emprestimo.id === devolverId);
  const misto = new Set(contas.map((conta) => conta.finalidade)).size > 1;
  const copiaLista = textosRetirada(misto ? "MISTO" : (contas[0]?.finalidade ?? "META"));
  const copia = editor ? textosRetirada(contaEscolhida?.finalidade ?? "META") : copiaLista;
  const plano = editor
    ? avaliarReposicao(editor.valorTotal, editor.parcelas, sobraMes)
    : sugerirParcelasReposicao(0, sobraMes);
  const precisaConfirmar = Boolean(editor && editor.valorTotal > 0.005 && !plano.cabeNoMes);

  useEffect(() => {
    if (!abrirNovo) return;
    setErro("");
    setConfirmarAperto(false);
    setEditor(rascunhoVazio(contaPadrao));
  }, [abrirNovo, contaPadrao]);

  const fechar = () => {
    setEditor(null);
    setDevolverId(null);
    setConfirmarExclusao(null);
    setConfirmarAperto(false);
    setErro("");
  };

  const registrar = () => {
    if (!editor) return;
    if (editor.valorTotal > saldoConta + 0.005) {
      setErro("Essa conta não tem saldo para essa retirada.");
      return;
    }
    if (precisaConfirmar && !confirmarAperto) {
      setConfirmarAperto(true);
      setErro("");
      return;
    }
    startTransition(async () => {
      const resposta = await registrarSaqueMetaAction({
        ...editor,
        sobraMes,
        confirmado: confirmarAperto,
      });
      if (resposta.ok) {
        setStatus(copia.statusSaque);
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
        setStatus(resposta.emprestimo?.quitado ? copia.statusQuitado : "Reposição registrada.");
        fechar();
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  const excluir = (id: string) => {
    startTransition(async () => {
      const resposta = await excluirEmprestimoMetaAction(id);
      if (resposta.ok) {
        setStatus("Retirada removida.");
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
          <p className="bloco-figura-rotulo">{copia.deve}</p>
          <p className={`amount ${aberto > 0.005 ? "text-outflow" : "text-inflow"}`}>{formatarMoeda(aberto)}</p>
        </>
      }
      acao={
        <div className="text-right">
          <button
            className="btn-primary"
            type="button"
            disabled={contas.length === 0 || saldoDisponivel(contas) < 0.005}
            onClick={() => {
              setErro("");
              setConfirmarAperto(false);
              setEditor(rascunhoVazio(contaPadrao));
            }}
          >
            {copia.botaoNovo}
          </button>
          {saldoDisponivel(contas) < 0.005 ? <p className="mt-1 text-xs text-mute">{copia.semSaldo}</p> : null}
        </div>
      }
    >
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {contas.length === 0 ? (
        <p className="vazio">{copia.semConta}</p>
      ) : emprestimos.length === 0 ? (
        <p className="vazio">{copia.vazio}</p>
      ) : (
        <ul className="grid gap-3">
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
                    Repor
                  </button>
                )}
              </header>
              {emprestimo.quitado ? (
                <p className="mt-3 text-sm text-inflow">{copia.voltou}</p>
              ) : (
                <>
                  <p className="money mt-3 text-xl font-medium">{formatarMoeda(emprestimo.aberto)}</p>
                  <p className="mt-1 text-sm text-mute">
                    {emprestimo.parcelaSugerida > 0.005
                      ? `Este mês repõe ${formatarMoeda(emprestimo.parcelaSugerida)} · restam ${emprestimo.parcelasRestantes}`
                      : `Adiantado neste mês · restam ${emprestimo.parcelasRestantes} ${emprestimo.parcelasRestantes === 1 ? "parcela" : "parcelas"}`}
                  </p>
                  <div className="mt-3">
                    <BarraMeta nome={`reposição ${emprestimo.nome}`} progresso={emprestimo.progresso} />
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
                    {emprestimo.pagoTotal < 0.005 ? "Desfazer retirada" : "Esquecer o resto"}
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

      <Modal aberto={Boolean(editor)} titulo={copia.tituloNovo} descricao={copia.descricaoNovo} onClose={fechar}>
        {editor ? (
          <FormularioModal
            onSubmit={registrar}
            resumo={
              editor.valorTotal > 0 && editor.parcelas > 0
                ? `Sai ${formatarMoeda(editor.valorTotal)} agora · repõe ${editor.parcelas}x de ${formatarMoeda(valorDaParcela(editor.valorTotal, editor.parcelas, 0))}`
                : copia.resumoVazio
            }
            erro={erro}
            acoes={
              <>
                {confirmarAperto ? (
                  <button className="btn" type="button" onClick={() => setConfirmarAperto(false)}>
                    Voltar
                  </button>
                ) : (
                  <span />
                )}
                <button className="btn-primary ml-auto" type="submit" disabled={pendente}>
                  {pendente
                    ? "Registrando…"
                    : confirmarAperto
                      ? "Confirmar retirada mesmo assim"
                      : copia.botaoSalvar}
                </button>
              </>
            }
          >
            <CampoTexto
              id="saque-nome"
              label={copia.labelNome}
              value={editor.nome}
              placeholder={copia.placeholderNome}
              autoFocus
              onChange={(nome) => {
                setConfirmarAperto(false);
                setEditor({ ...editor, nome });
              }}
            />
            {contas.length > 1 ? (
              <CampoSelect
                id="saque-conta"
                label="De qual conta"
                value={editor.contaId}
                onChange={(contaId) => {
                  setConfirmarAperto(false);
                  setEditor({ ...editor, contaId });
                }}
              >
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} · {ROTULOS_FINALIDADE[conta.finalidade]} · {formatarMoeda(conta.saldo)}
                  </option>
                ))}
              </CampoSelect>
            ) : null}
            <CampoLinha>
              <CampoMoeda
                id="saque-total"
                label="Valor da retirada"
                hint={
                  saldoConta > 0.005
                    ? `Saldo disponível: ${formatarMoeda(saldoConta)}.`
                    : "Essa conta está zerada. Junte um pouco antes de sacar."
                }
                value={editor.valorTotal}
                onChange={(valorTotal) => {
                  const sugestao = sugerirParcelasReposicao(valorTotal, sobraMes);
                  setConfirmarAperto(false);
                  setEditor({ ...editor, valorTotal, parcelas: sugestao.parcelas });
                }}
              />
              <CampoPassos
                id="saque-parcelas"
                label="Repõe em"
                value={editor.parcelas}
                min={1}
                max={48}
                onChange={(parcelas) => {
                  setConfirmarAperto(false);
                  setEditor({ ...editor, parcelas });
                }}
                detalhe={
                  editor.parcelas === 1 ? "1 mês" : `${editor.parcelas} meses`
                }
              />
            </CampoLinha>
            {editor.valorTotal > 0.005 ? (
              precisaConfirmar ? (
                <p className="rito-aperto" role="status">
                  {confirmarAperto
                    ? `Neste mês sobra ${formatarMoeda(sobraMes)}. Mesmo em ${plano.parcelas}x de ${formatarMoeda(plano.valorParcela)}, repor deixa o mês negativo. Confirmem a retirada se quiserem seguir.`
                    : `Neste mês sobra ${formatarMoeda(sobraMes)}. Não dá para repor ${formatarMoeda(plano.valorParcela)} por mês sem ficar negativo.`}
                </p>
              ) : (
                <p className="text-sm text-mute">
                  Sobra neste mês: {formatarMoeda(sobraMes)}. Cabe em {plano.parcelas}x de{" "}
                  {formatarMoeda(plano.valorParcela)}, sem deixar negativo.
                </p>
              )
            ) : null}
            <CampoMes
              id="saque-inicio"
              label="Primeira reposição"
              value={editor.competenciaInicio}
              onChange={(competenciaInicio) => {
                setConfirmarAperto(false);
                setEditor({ ...editor, competenciaInicio });
              }}
            />
          </FormularioModal>
        ) : null}
      </Modal>

      <Modal
        aberto={Boolean(emprestimoDevolucao)}
        titulo={copia.tituloDevolver}
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
                  {pendente ? "Repor…" : copia.botaoDevolver}
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
                  : "Pode repor o que couber neste mês."
              }
              value={valorDevolucao}
              onChange={setValorDevolucao}
            />
            <p className="text-sm text-mute">Começou em {formatarCompetenciaCurta(emprestimoDevolucao.competenciaInicio)}.</p>
          </FormularioModal>
        ) : null}
      </Modal>
    </Bloco>
  );
}

const saldoDisponivel = (contas: ContaComProgresso[]) =>
  contas.reduce((acc, conta) => acc + conta.saldo, 0);

const textosRetirada = (finalidade: FinalidadeConta | "MISTO") => {
  if (finalidade === "MISTO") {
    return {
      deve: "Ainda falta repor",
      botaoNovo: "Registrar retirada",
      semSaldo: "Junte na reserva ou na meta para retirar.",
      semConta: "Cadastre reserva ou meta para retirar.",
      vazio: "Nada devido. Quando retirar da reserva ou da meta, a reposição aparece aqui.",
      tituloNovo: "Registrar retirada",
      descricaoNovo:
        "O valor sai agora. O sistema sugere em quantas vezes repor para o mês não ficar negativo.",
      resumoVazio: "O valor sai da conta. Você repõe aos poucos.",
      labelNome: "Motivo da retirada",
      placeholderNome: "Ex.: Extra da casa…",
      botaoSalvar: "Sacar e repor depois",
      statusSaque: "Retirada registrada.",
      voltou: "Voltou para a conta.",
      tituloDevolver: "Repor a retirada",
      botaoDevolver: "Repor",
      statusQuitado: "Voltou tudo para a conta.",
    };
  }
  if (finalidade === "POUPANCA") {
    return {
      deve: "Você deve à poupança",
      botaoNovo: "Retirar da poupança",
      semSaldo: "Junte na poupança para retirar.",
      semConta: "Cadastre a poupança para retirar.",
      vazio: "Nada devido. Quando retirar da poupança, a reposição aparece aqui.",
      tituloNovo: "Retirar da poupança",
      descricaoNovo:
        "O valor sai agora. O sistema sugere em quantas vezes repor para o mês não ficar negativo.",
      resumoVazio: "O valor sai da poupança. Você repõe aos poucos.",
      labelNome: "Motivo da retirada",
      placeholderNome: "Ex.: Consertar o carro…",
      botaoSalvar: "Sacar e repor depois",
      statusSaque: "Retirada da poupança registrada.",
      voltou: "Voltou para a poupança.",
      tituloDevolver: "Repor na poupança",
      botaoDevolver: "Repor na poupança",
      statusQuitado: "Voltou tudo para a poupança.",
    };
  }
  if (finalidade === "RESERVA") {
    return {
      deve: "Você deve à reserva",
      botaoNovo: "Retirar da reserva",
      semSaldo: "Junte na reserva para retirar.",
      semConta: "Cadastre a reserva para retirar.",
      vazio: "Nada devido. Quando retirar da reserva, a reposição aparece aqui.",
      tituloNovo: "Retirar da reserva",
      descricaoNovo:
        "O valor sai agora. O sistema sugere em quantas vezes repor para o mês não ficar negativo.",
      resumoVazio: "O valor sai da reserva. Você repõe aos poucos.",
      labelNome: "Motivo da retirada",
      placeholderNome: "Ex.: Extra de saúde…",
      botaoSalvar: "Sacar e repor depois",
      statusSaque: "Retirada da reserva registrada.",
      voltou: "Voltou para a reserva.",
      tituloDevolver: "Repor na reserva",
      botaoDevolver: "Repor na reserva",
      statusQuitado: "Voltou tudo para a reserva.",
    };
  }
  return {
    deve: "Você deve à meta",
    botaoNovo: "Comprar com a meta",
    semSaldo: "Junte na meta para sacar à vista.",
    semConta: "Cadastre a conta da meta para sacar à vista.",
    vazio: "Nada devido. Quando sacar da meta para pagar à vista, a dívida consigo aparece aqui.",
    tituloNovo: "Comprar com a meta",
    descricaoNovo:
      "O valor sai da meta agora. O sistema sugere em quantas vezes repor para o mês não ficar negativo.",
    resumoVazio: "O valor sai da meta. Você devolve aos poucos.",
    labelNome: "O que vai comprar",
    placeholderNome: "Ex.: Sofá, mesa…",
    botaoSalvar: "Sacar e ficar devendo",
    statusSaque: "Saque da meta registrado. Você ficou devendo para si.",
    voltou: "Voltou para a meta.",
    tituloDevolver: "Repor na meta",
    botaoDevolver: "Repor na meta",
    statusQuitado: "Voltou tudo para a meta.",
  };
};
