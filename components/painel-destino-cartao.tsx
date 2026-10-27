"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { salvarDestinoCartaoAction } from "@/app/actions/renda";
import { Bloco } from "@/components/bloco";
import { CampoTexto } from "@/components/campo";

type Props = {
  nome: string;
  chavePix: string;
};

export function PainelDestinoCartao({ nome, chavePix }: Props) {
  const router = useRouter();
  const [destino, setDestino] = useState(nome);
  const [chave, setChave] = useState(chavePix);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();

  const salvar = () => {
    setErro("");
    startTransition(async () => {
      const resposta = await salvarDestinoCartaoAction(destino, chave);
      if (resposta.ok) {
        setStatus("Destino do cartão salvo.");
        router.refresh();
      } else {
        setErro(resposta.erro);
      }
    });
  };

  return (
    <Bloco
      titulo="Destino do cartão"
      nota="Vocês transferem para essa conta e pagam a fatura. A chave é da conta, não do QR que muda todo mês."
    >
      <form
        className="grid max-w-[28rem] gap-3"
        onSubmit={(evento) => {
          evento.preventDefault();
          salvar();
        }}
      >
        <CampoTexto
          id="destino-cartao-nome"
          label="Conta"
          value={destino}
          placeholder="Ex.: Nubank Ayrle"
          onChange={setDestino}
        />
        <CampoTexto
          id="destino-cartao-chave"
          label="Chave PIX"
          hint="Opcional."
          value={chave}
          placeholder="CPF, e-mail, telefone ou aleatória"
          onChange={setChave}
        />
        {erro ? (
          <p className="text-sm text-outflow" role="alert">
            {erro}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn" type="submit" disabled={pendente}>
            {pendente ? "Salvando…" : "Salvar destino"}
          </button>
          {status ? <p className="text-sm text-mute">{status}</p> : null}
        </div>
      </form>
    </Bloco>
  );
}
