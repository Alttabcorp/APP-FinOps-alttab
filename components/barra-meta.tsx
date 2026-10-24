import type { ProgressoMeta } from "@/lib/domain/financeiro/conta";
import { formatarMoeda, formatarPercentual } from "@/lib/formatacao";

type Props = {
  nome: string;
  progresso: ProgressoMeta;
  destaque?: boolean;
};

export function BarraMeta({ nome, progresso, destaque = false }: Props) {
  if (!progresso.temMeta) return null;

  const rotulo = progresso.atingida
    ? progresso.excedente > 0.005
      ? `Meta de ${nome} atingida, ${formatarMoeda(progresso.excedente)} a mais`
      : `Meta de ${nome} atingida`
    : `Progresso de ${nome}: ${formatarPercentual(progresso.percentual)}, faltam ${formatarMoeda(progresso.falta)}`;

  return (
    <div>
      <div
        className={`barra-meta ${destaque ? "is-grande" : ""}`}
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progresso.percentualBarra)}
      >
        <div
          className={`barra-meta-fill ${progresso.atingida ? "is-completa" : ""}`}
          style={{ width: `${Math.max(progresso.percentualBarra, 0)}%` }}
        />
      </div>
      <p
        className={`mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 ${
          destaque ? "text-sm" : "text-xs"
        }`}
      >
        <span className="money font-medium">{formatarPercentual(progresso.percentual)}</span>
        <span className="text-mute">
          {progresso.atingida
            ? progresso.excedente > 0.005
              ? `Atingida · ${formatarMoeda(progresso.excedente)} acima`
              : "Atingida"
            : `faltam ${formatarMoeda(progresso.falta)}`}
        </span>
      </p>
    </div>
  );
}
