"use client";

import { useState } from "react";
import { formatarCompetencia, formatarCompetenciaCurta } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

export type LinhaHistorico = {
  competencia: string;
  ganhou: number;
  gasto: number;
  sobrou: number;
  gastoMensal?: number;
  investido?: number;
  meta?: number;
  contasPagas?: number;
  contasTotal?: number;
  fechado?: boolean;
};

const SERIES = [
  { chave: "ganhou" as const, rotulo: "Ganhou", cor: "#1b5f4a" },
  { chave: "gasto" as const, rotulo: "Gastou", cor: "#9c3a28" },
  { chave: "sobrou" as const, rotulo: "Sobrou", cor: "#141c19" },
];

type Props = {
  linhas: LinhaHistorico[];
  onSelecionar?: (linha: LinhaHistorico) => void;
  compacto?: boolean;
};

export function GraficoHistorico({ linhas, onSelecionar, compacto = false }: Props) {
  const [ativo, setAtivo] = useState<number | null>(null);
  if (!linhas.length) return null;

  const maximo = Math.max(
    ...linhas.flatMap((linha) => SERIES.map((serie) => Math.abs(linha[serie.chave]))),
    1,
  );
  const largura = 720;
  const altura = compacto ? 168 : 280;
  const margem = { top: 12, right: 8, bottom: compacto ? 36 : 44, left: 8 };
  const area = largura - margem.left - margem.right;
  const grupo = area / linhas.length;
  const barra = Math.max(6, (grupo - 12) / SERIES.length);
  const destaque = ativo === null ? null : linhas[ativo];

  return (
    <figure className="mt-4">
      <svg
        role="img"
        aria-label="Comparativo de ganhou, gastou e sobrou nos últimos meses"
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-auto w-full"
      >
        {linhas.map((linha, i) => (
          <g
            key={linha.competencia}
            transform={`translate(${margem.left + i * grupo}, 0)`}
            className="cursor-pointer"
            tabIndex={onSelecionar ? 0 : undefined}
            role={onSelecionar ? "button" : undefined}
            aria-label={formatarCompetencia(linha.competencia)}
            onMouseEnter={() => setAtivo(i)}
            onMouseLeave={() => setAtivo(null)}
            onFocus={() => setAtivo(i)}
            onBlur={() => setAtivo(null)}
            onClick={() => onSelecionar?.(linha)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                onSelecionar?.(linha);
              }
            }}
          >
            <rect
              x={0}
              y={margem.top}
              width={grupo}
              height={altura - margem.top - margem.bottom}
              fill={ativo === i ? "rgba(62,92,82,0.1)" : "transparent"}
            />
            {SERIES.map((serie, s) => {
              const valor = linha[serie.chave];
              const h = (Math.abs(valor) / maximo) * (altura - margem.top - margem.bottom);
              const x = 6 + s * barra;
              const y = altura - margem.bottom - h;
              return (
                <rect key={serie.chave} x={x} y={y} width={barra - 2} height={h} fill={serie.cor}>
                  <title>{`${formatarCompetencia(linha.competencia)} · ${serie.rotulo} · ${formatarMoeda(valor)}`}</title>
                </rect>
              );
            })}
            <text x={grupo / 2} y={altura - 16} textAnchor="middle" fill="#5C726A" fontSize="11">
              {formatarCompetenciaCurta(linha.competencia)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-mute">
        <span className="flex flex-wrap gap-4">
          {SERIES.map((serie) => (
            <span key={serie.chave} className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2" style={{ background: serie.cor }} aria-hidden="true" />
              {serie.rotulo}
            </span>
          ))}
        </span>
        {destaque ? (
          <span className="money text-ink">
            {formatarCompetencia(destaque.competencia)}: ganhou {formatarMoeda(destaque.ganhou)}, gastou{" "}
            {formatarMoeda(destaque.gasto)}, sobrou {formatarMoeda(destaque.sobrou)}
          </span>
        ) : (
          <span>Passe o cursor ou clique num mês para ver o detalhe.</span>
        )}
      </figcaption>
    </figure>
  );
}
