"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";

type CampoBase = {
  id: string;
  label: string;
  hint?: string;
  erro?: string;
};

export function Campo({
  id,
  label,
  hint,
  erro,
  children,
}: CampoBase & { children: ReactNode }) {
  return (
    <div className="campo">
      <label className="campo-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? <p className="campo-hint">{hint}</p> : null}
      {erro ? (
        <p className="campo-erro" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

type CampoTextoProps = CampoBase & {
  value: string;
  onChange: (valor: string) => void;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
};

export function CampoTexto({
  id,
  label,
  hint,
  erro,
  value,
  onChange,
  name,
  placeholder,
  autoComplete = "off",
  autoFocus = false,
}: CampoTextoProps) {
  return (
    <Campo id={id} label={label} hint={hint} erro={erro}>
      <input
        id={id}
        name={name ?? id}
        className="field"
        value={value}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        spellCheck={false}
        placeholder={placeholder}
        onChange={(evento) => onChange(evento.target.value)}
      />
    </Campo>
  );
}

type CampoAreaProps = CampoBase & {
  value: string;
  onChange: (valor: string) => void;
  name?: string;
  placeholder?: string;
};

export function CampoArea({
  id,
  label,
  hint,
  erro,
  value,
  onChange,
  name,
  placeholder,
}: CampoAreaProps) {
  return (
    <Campo id={id} label={label} hint={hint} erro={erro}>
      <textarea
        id={id}
        name={name ?? id}
        className="field field-area"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(evento) => onChange(evento.target.value)}
      />
    </Campo>
  );
}

type CampoSelectProps = CampoBase & {
  value: string;
  onChange: (valor: string) => void;
  name?: string;
  children: ReactNode;
} & Pick<SelectHTMLAttributes<HTMLSelectElement>, "disabled">;

export function CampoSelect({
  id,
  label,
  hint,
  erro,
  value,
  onChange,
  name,
  children,
  disabled,
}: CampoSelectProps) {
  return (
    <Campo id={id} label={label} hint={hint} erro={erro}>
      <select
        id={id}
        name={name ?? id}
        className="field field-select"
        value={value}
        disabled={disabled}
        onChange={(evento) => onChange(evento.target.value)}
      >
        {children}
      </select>
    </Campo>
  );
}

export function CampoLinha({ children }: { children: ReactNode }) {
  return <div className="campo-linha">{children}</div>;
}
