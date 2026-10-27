"use client";

import { Modal } from "@/components/modal";

type Props = {
  aberto: boolean;
  modo: "fechar" | "reabrir";
  contasAbertas: number;
  pendente: boolean;
  onClose: () => void;
  onConfirmar: () => void;
};

export function ModalFecharMes({ aberto, modo, contasAbertas, pendente, onClose, onConfirmar }: Props) {
  if (modo === "reabrir") {
    return (
      <Modal
        aberto={aberto}
        titulo="Reabrir este mês"
        descricao="O histórico volta a ser rascunho até vocês fecharem outra vez."
        onClose={onClose}
      >
        <div className="flex flex-wrap gap-2">
          <button className="btn" type="button" onClick={onClose}>
            Manter fechado
          </button>
          <button className="btn-primary disabled:opacity-60" type="button" disabled={pendente} onClick={onConfirmar}>
            {pendente ? "Reabrindo…" : "Reabrir mês"}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Fechar este mês"
      descricao="Os números entram no histórico e só mudam se vocês reabrirem."
      onClose={onClose}
    >
      {contasAbertas > 0 ? (
        <p className="text-sm text-outflow">
          {contasAbertas === 1 ? "Ainda falta 1 conta." : `Ainda faltam ${contasAbertas} contas.`}
        </p>
      ) : (
        <p className="text-sm">Pode fechar. Contas em dia.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn" type="button" onClick={onClose}>
          Continuar
        </button>
        <button className="btn-primary disabled:opacity-60" type="button" disabled={pendente} onClick={onConfirmar}>
          {pendente ? "Fechando…" : "Fechar mês"}
        </button>
      </div>
    </Modal>
  );
}
