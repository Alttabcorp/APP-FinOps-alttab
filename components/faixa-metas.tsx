"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { salvarGastoPessoalAction } from "@/app/actions/renda";
import { CampoMoeda } from "@/components/campo-moeda";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  gastoPessoal: number;
  gastoPessoalAlvo?: number | null;
  sugestaoMetaMes?: number;
};

export function FaixaGastoPessoal({
  gastoPessoal,
  gastoPessoalAlvo = null,
  sugestaoMetaMes = 0,
}: Props) {
  const router = useRouter();
  const [alvo, setAlvo] = useState(gastoPessoalAlvo ?? gastoPessoal);
  const [status, setStatus] = useState("");
  const [pendente, startTransition] = useTransition();

  useEffect(() => {
    setAlvo(gastoPessoalAlvo ?? gastoPessoal);
  }, [gastoPessoalAlvo, gastoPessoal]);

  return (
    <section className="ficha">
      <p className="text-sm text-mute">Gastos pessoais neste mês</p>
      <p className="money mt-1 text-2xl font-medium">{formatarMoeda(gastoPessoal)}</p>
      <p className="mt-1 max-w-[46ch] text-sm text-mute">
        {sugestaoMetaMes >= 0.005
          ? `Depois disso, sobram ${formatarMoeda(sugestaoMetaMes)} para a meta ou mais investimento.`
          : "Não sobrou para a meta neste mês."}
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        onSubmit={(evento) => {
          evento.preventDefault();
          startTransition(async () => {
            const resposta = await salvarGastoPessoalAction(alvo);
            if (resposta.ok) {
              setStatus("Gasto pessoal salvo.");
              router.refresh();
            } else setStatus(resposta.erro);
          });
        }}
      >
        <CampoMoeda
          id="gasto-pessoal"
          label="Valor a deixar para gastos pessoais"
          hint="Fora as contas da casa. O resto vai para a meta."
          value={alvo}
          onChange={setAlvo}
        />
        <button className="btn-primary" type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar valor"}
        </button>
      </form>
      {status ? (
        <p className="mt-2 text-xs text-mute" aria-live="polite">
          {status}
        </p>
      ) : null}
    </section>
  );
}
