"use client";

import { useEffect, useState } from "react";
import { Campo } from "@/components/campo";
import { paraNumero } from "@/lib/formatacao";

type Props = {
  id: string;
  label: string;
  value: number;
  onChange: (valor: number) => void;
  /** Chamado ao sair do campo, com o valor final. */
  onCommit?: (valor: number) => void;
  name?: string;
  hint?: string;
  rotuloVisivel?: boolean;
  autoFocus?: boolean;
  compact?: boolean;
  disabled?: boolean;
};

const formatarEntrada = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(valor) ? valor : 0);

export function CampoMoeda({
  id,
  label,
  value,
  onChange,
  onCommit,
  name,
  hint,
  rotuloVisivel = true,
  autoFocus = false,
  compact = false,
  disabled = false,
}: Props) {
  const [texto, setTexto] = useState(() => formatarEntrada(value));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (!focado) setTexto(formatarEntrada(value));
  }, [value, focado]);

  const campo = (
    <div
      className={`field-money ${compact ? "is-compact" : ""} ${focado ? "is-focused" : ""} ${
        disabled ? "is-disabled" : ""
      }`}
    >
      <span className="field-money-prefix" aria-hidden="true">
        R$
      </span>
      <input
        id={id}
        name={name ?? id}
        size={1}
        className={`money min-w-0 w-full flex-1 border-0 bg-transparent text-right outline-none ${
          compact ? "py-1.5 pr-2 text-sm" : "py-2.5 pr-3 text-base"
        }`}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
        disabled={disabled}
        value={texto}
        onFocus={(evento) => {
          if (disabled) return;
          setFocado(true);
          evento.currentTarget.select();
        }}
        onBlur={() => {
          const numero = paraNumero(texto);
          setFocado(false);
          onChange(numero);
          onCommit?.(numero);
          setTexto(formatarEntrada(numero));
        }}
        onKeyDown={(evento) => {
          if (evento.key !== "Enter") return;
          evento.preventDefault();
          const campos = Array.from(
            document.querySelectorAll<HTMLInputElement>(".field-money input:not(:disabled)"),
          );
          const proximo = campos[campos.indexOf(evento.currentTarget) + 1];
          if (proximo) proximo.focus();
          else evento.currentTarget.blur();
        }}
        onChange={(evento) => {
          const proximo = evento.target.value;
          setTexto(proximo);
          onChange(paraNumero(proximo));
        }}
      />
    </div>
  );

  if (!rotuloVisivel) {
    return (
      <div className="min-w-0">
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        {campo}
      </div>
    );
  }

  return (
    <Campo id={id} label={label} hint={hint}>
      {campo}
    </Campo>
  );
}
