"use client";

import { useEffect, useRef, useState } from "react";

export type AcaoFlutuante = { rotulo: string; onClick: () => void };

type Props = {
  rotulo: string;
  onClick?: () => void;
  /** Se informado, o + abre um menu com essas opções (ex.: Feira, Gasolina, Nova despesa). */
  acoes?: AcaoFlutuante[];
};

/** Botão flutuante "+" do celular. No desktop fica oculto (o botão do cabeçalho aparece). */
export function BotaoFlutuante({ rotulo, onClick, acoes }: Props) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const temMenu = Boolean(acoes && acoes.length > 0);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (evento: MouseEvent | TouchEvent) => {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) setAberto(false);
    };
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    document.addEventListener("touchstart", fechar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("touchstart", fechar);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  if (!temMenu) {
    return (
      <button type="button" className="fab" onClick={onClick} aria-label={rotulo} title={rotulo}>
        <span aria-hidden="true">+</span>
      </button>
    );
  }

  return (
    <div className={`fab-grupo ${aberto ? "is-aberto" : ""}`} ref={raiz}>
      {aberto ? (
        <div className="fab-menu" role="menu" aria-label={rotulo}>
          {acoes!.map((acao) => (
            <button
              key={acao.rotulo}
              type="button"
              className="fab-opcao"
              role="menuitem"
              onClick={() => {
                setAberto(false);
                acao.onClick();
              }}
            >
              {acao.rotulo}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="fab"
        aria-label={aberto ? "Fechar menu" : rotulo}
        aria-expanded={aberto}
        aria-haspopup="menu"
        title={rotulo}
        onClick={() => setAberto((valor) => !valor)}
      >
        <span aria-hidden="true">{aberto ? "×" : "+"}</span>
      </button>
    </div>
  );
}
