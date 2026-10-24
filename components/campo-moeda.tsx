"use client";

import { useEffect, useState } from "react";
import { Campo } from "@/components/campo";
import { paraNumero } from "@/lib/formatacao";

type Props = {
  id: string;
  label: string;
  value: number;
  onChange: (valor: number) => void;
  name?: string;
  hint?: string;
  rotuloVisivel?: boolean;
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
  name,
  hint,
  rotuloVisivel = true,
}: Props) {
  const [texto, setTexto] = useState(() => formatarEntrada(value));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (!focado) setTexto(formatarEntrada(value));
  }, [value, focado]);

  const campo = (
    <div className={`field-money ${focado ? "is-focused" : ""}`}>
      <span className="field-money-prefix" aria-hidden="true">
        R$
      </span>
      <input
        id={id}
        name={name ?? id}
        size={1}
        className="money min-w-0 w-full flex-1 border-0 bg-transparent py-2.5 pr-3 text-right text-base outline-none"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={texto}
        onFocus={(evento) => {
          setFocado(true);
          evento.currentTarget.select();
        }}
        onBlur={() => {
          const numero = paraNumero(texto);
          setFocado(false);
          onChange(numero);
          setTexto(formatarEntrada(numero));
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
