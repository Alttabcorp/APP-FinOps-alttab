"use client";

import { Campo } from "@/components/campo";
import {
  avancarCompetencia,
  competenciaAtual,
  formatarCompetencia,
  isCompetencia,
  opcoesCompetencia,
} from "@/lib/domain/financeiro/competencia";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  hint?: string;
  name?: string;
};

export function CampoMes({ id, label, value, onChange, hint, name }: Props) {
  const atual = isCompetencia(value) ? value : competenciaAtual();
  const opcoes = opcoesCompetencia(competenciaAtual());
  const lista = opcoes.some((opcao) => opcao.valor === atual)
    ? opcoes
    : [{ valor: atual, rotulo: formatarCompetencia(atual) }, ...opcoes];

  return (
    <Campo id={id} label={label} hint={hint}>
      <div className="campo-passos">
        <button
          className="passo-btn"
          type="button"
          aria-label="Mês anterior"
          onClick={() => onChange(avancarCompetencia(atual, -1))}
        >
          −
        </button>
        <select
          id={id}
          name={name ?? id}
          className="field field-select"
          value={atual}
          onChange={(evento) => onChange(evento.target.value)}
        >
          {lista.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
        <button
          className="passo-btn"
          type="button"
          aria-label="Próximo mês"
          onClick={() => onChange(avancarCompetencia(atual, 1))}
        >
          +
        </button>
      </div>
    </Campo>
  );
}
