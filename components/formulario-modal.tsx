"use client";

import type { ReactNode } from "react";

type FormProps = {
  onSubmit: () => void;
  resumo?: ReactNode;
  children: ReactNode;
  acoes: ReactNode;
  erro?: string;
};

export function FormularioLeve({ resumo, children }: { resumo?: ReactNode; children: ReactNode }) {
  return (
    <div className="form-leve">
      {resumo ? (
        <p className="form-resumo" aria-live="polite">
          {resumo}
        </p>
      ) : null}
      <div className="form-leve-campos">{children}</div>
    </div>
  );
}

export function FormularioModal({ onSubmit, resumo, children, acoes, erro }: FormProps) {
  return (
    <form
      className="form-modal"
      onSubmit={(evento) => {
        evento.preventDefault();
        onSubmit();
      }}
    >
      {resumo ? (
        <p className="form-resumo" aria-live="polite">
          {resumo}
        </p>
      ) : null}
      <div className="form-campos">{children}</div>
      {erro ? (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      ) : null}
      <div className="form-acoes">{acoes}</div>
    </form>
  );
}

type AcoesProps = {
  pendente: boolean;
  podeExcluir?: boolean;
  confirmarExclusao?: boolean;
  onPedirExclusao?: () => void;
  onCancelarExclusao?: () => void;
  onExcluir?: () => void;
  onVoltar?: () => void;
  salvar: string;
  salvando?: string;
  excluir?: string;
  confirmar?: string;
};

export function AcoesCadastro({
  pendente,
  podeExcluir = false,
  confirmarExclusao = false,
  onPedirExclusao,
  onCancelarExclusao,
  onExcluir,
  onVoltar,
  salvar,
  salvando = "Salvando…",
  excluir = "Remover",
  confirmar = "Confirmar remoção",
}: AcoesProps) {
  return (
    <>
      {podeExcluir ? (
        confirmarExclusao ? (
          <div className="flex flex-wrap gap-2">
            <button className="btn" type="button" onClick={onCancelarExclusao}>
              Manter
            </button>
            <button className="btn-danger" type="button" disabled={pendente} onClick={onExcluir}>
              {pendente ? "Removendo…" : confirmar}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {onVoltar ? (
              <button className="btn" type="button" onClick={onVoltar}>
                Voltar
              </button>
            ) : null}
            <button className="btn-link-danger" type="button" onClick={onPedirExclusao}>
              {excluir}
            </button>
          </div>
        )
      ) : onVoltar ? (
        <button className="btn" type="button" onClick={onVoltar}>
          Voltar
        </button>
      ) : (
        <span />
      )}
      <button className="btn-primary" type="submit" disabled={pendente && !confirmarExclusao}>
        {pendente && !confirmarExclusao ? salvando : salvar}
      </button>
    </>
  );
}
