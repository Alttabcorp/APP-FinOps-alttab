"use client";

import { Campo } from "@/components/campo";

type Props = {
  id: string;
  label: string;
  value: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
  hint?: string;
  name?: string;
  detalhe?: string;
};

export function CampoPassos({
  id,
  label,
  value,
  onChange,
  min = 1,
  max = 48,
  hint,
  name,
  detalhe,
}: Props) {
  const atual = Number.isFinite(value) ? value : min;
  const limitar = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <Campo id={id} label={label} hint={hint}>
      <div className="campo-passos">
        <button
          className="passo-btn"
          type="button"
          aria-label="Diminuir"
          disabled={atual <= min}
          onClick={() => onChange(limitar(atual - 1))}
        >
          −
        </button>
        <input
          id={id}
          name={name ?? id}
          size={1}
          className="field field-passo money min-w-0"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={atual}
          onChange={(evento) => {
            const n = Number.parseInt(evento.target.value, 10);
            onChange(Number.isFinite(n) ? limitar(n) : min);
          }}
        />
        <button
          className="passo-btn"
          type="button"
          aria-label="Aumentar"
          disabled={atual >= max}
          onClick={() => onChange(limitar(atual + 1))}
        >
          +
        </button>
      </div>
      {detalhe ? <p className="campo-detalhe">{detalhe}</p> : null}
    </Campo>
  );
}
