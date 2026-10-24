"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  onClose: () => void;
  children: React.ReactNode;
  largura?: "md" | "lg";
};

export function Modal({ aberto, titulo, descricao, onClose, children, largura = "md" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descId = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className={`modal ${largura === "lg" ? "modal-lg" : ""}`}
      aria-labelledby={tituloId}
      aria-describedby={descricao ? descId : undefined}
      onClose={onClose}
      onClick={(evento) => {
        if (evento.target === ref.current) onClose();
      }}
    >
      <header className="modal-topo">
        <div className="min-w-0">
          <h2 id={tituloId} className="titulo text-[1.25rem]">
            {titulo}
          </h2>
          {descricao ? (
            <p id={descId} className="mt-1.5 max-w-[42ch] text-sm leading-snug text-mute">
              {descricao}
            </p>
          ) : null}
        </div>
        <button className="btn shrink-0" type="button" onClick={onClose} aria-label="Fechar">
          Fechar
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
