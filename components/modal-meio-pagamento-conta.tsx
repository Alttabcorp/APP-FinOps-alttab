"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import {
  MEIOS_PAGAMENTO_CONTA,
  ROTULOS_MEIO_PAGAMENTO_CONTA,
  type MeioPagamentoConta,
} from "@/lib/domain/financeiro/meio-pagamento-conta";
import { formatarMoeda } from "@/lib/formatacao";

const DETALHES: Record<MeioPagamentoConta, string> = {
  DINHEIRO: "Saiu da conta / caixa.",
  CARTAO: "Foi no crédito (já conta na fatura se lançou lá).",
  VALE: "Usou o vale-alimentação.",
};

type Props = {
  aberto: boolean;
  nome: string;
  valor: number;
  onConfirmar: (meio: MeioPagamentoConta) => void;
  onCancelar: () => void;
};

export function ModalMeioPagamentoConta({ aberto, nome, valor, onConfirmar, onCancelar }: Props) {
  const [meio, setMeio] = useState<MeioPagamentoConta>("DINHEIRO");
  useEffect(() => {
    if (aberto) setMeio("DINHEIRO");
  }, [aberto]);

  return (
    <Modal
      aberto={aberto}
      titulo="Como pagou?"
      descricao={`${nome || "Conta"} · ${formatarMoeda(valor)}`}
      onClose={onCancelar}
    >
      <form
        className="grid gap-3"
        onSubmit={(evento) => {
          evento.preventDefault();
          onConfirmar(meio);
        }}
      >
        <fieldset className="tipo-conta" aria-label="Meio de pagamento">
          <legend className="sr-only">Meio de pagamento</legend>
          {MEIOS_PAGAMENTO_CONTA.map((opcao) => (
            <label key={opcao} className={`tipo-conta-opcao ${meio === opcao ? "is-ativo" : ""}`}>
              <input
                type="radio"
                name="meio-pagamento-conta"
                checked={meio === opcao}
                onChange={() => setMeio(opcao)}
              />
              <span className="tipo-conta-rotulo">{ROTULOS_MEIO_PAGAMENTO_CONTA[opcao]}</span>
              <span className="tipo-conta-detalhe">{DETALHES[opcao]}</span>
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">
            Marcar como paga
          </button>
          <button type="button" className="btn" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
