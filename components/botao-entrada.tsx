"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registrarEntradaAction } from "@/app/actions/transacao";
import { CampoSelect, CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { Modal } from "@/components/modal";

type Props = {
  contas: { id: string; nome: string }[];
  /** Quando informado, a caixinha já vem escolhida e fixa. */
  contaId?: string;
  rotulo?: string;
  className?: string;
};

export function BotaoEntrada({ contas, contaId, rotulo = "Nova entrada", className = "btn text-sm" }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [conta, setConta] = useState(contaId ?? contas[0]?.id ?? "");
  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [pendente, startTransition] = useTransition();

  const nomeConta = contas.find((item) => item.id === (contaId ?? conta))?.nome ?? "";

  const salvar = () => {
    setErro("");
    startTransition(async () => {
      const resposta = await registrarEntradaAction({ contaId: contaId ?? conta, valor, descricao });
      if (resposta.ok) {
        setMensagem(resposta.mensagem);
        setValor(0);
        setDescricao("");
        setAberto(false);
        router.refresh();
      } else setErro(resposta.erro);
    });
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setErro("");
          setMensagem("");
          setAberto(true);
        }}
      >
        {rotulo}
      </button>
      {mensagem ? (
        <span className="sr-only" role="status">
          {mensagem}
        </span>
      ) : null}
      <Modal
        aberto={aberto}
        titulo={contaId ? `Entrada em ${nomeConta}` : "Nova entrada"}
        descricao="Dinheiro que entrou fora do checklist do mês: uma venda, um presente, um rendimento. O valor soma no saldo da caixinha e fica no histórico."
        onClose={() => setAberto(false)}
      >
        <form
          className="grid gap-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            salvar();
          }}
        >
          {contaId ? null : (
            <CampoSelect id="entrada-conta" label="Caixinha" value={conta} onChange={setConta}>
              {contas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </CampoSelect>
          )}
          <CampoMoeda id="entrada-valor" label="Valor" value={valor} onChange={setValor} autoFocus />
          <CampoTexto
            id="entrada-descricao"
            label="De onde veio"
            value={descricao}
            placeholder="Ex.: Venda de impressão 3D"
            onChange={setDescricao}
          />
          {erro ? (
            <p className="text-sm text-outflow" role="alert">
              {erro}
            </p>
          ) : null}
          <button type="submit" className="btn-primary" disabled={pendente}>
            {pendente ? "Salvando…" : "Registrar entrada"}
          </button>
        </form>
      </Modal>
    </>
  );
}
