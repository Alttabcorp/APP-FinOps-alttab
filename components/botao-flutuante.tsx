"use client";

/** Botão flutuante "+" do celular. No desktop fica oculto (o botão do cabeçalho aparece). */
export function BotaoFlutuante({ rotulo, onClick }: { rotulo: string; onClick: () => void }) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label={rotulo} title={rotulo}>
      <span aria-hidden="true">+</span>
    </button>
  );
}
