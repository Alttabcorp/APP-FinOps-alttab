import { formatarMoeda, formatarVariacao } from "@/lib/formatacao";

type Props = {
  rotulo: string;
  sugestao: number;
  real: number;
  invertida?: boolean;
};

export function classeVariacao(valor: number, invertida = false) {
  if (Math.abs(valor) < 0.005) return "text-mute";
  const positiva = invertida ? valor < 0 : valor > 0;
  return positiva ? "variacao-positiva" : "variacao-negativa";
}

export function ComparativoValores({ rotulo, sugestao, real, invertida = false }: Props) {
  const maximo = Math.max(Math.abs(sugestao), Math.abs(real), 1);
  const variacao = real - sugestao;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{rotulo}</span>
        <span className={`money ${classeVariacao(variacao, invertida)}`}>{formatarVariacao(variacao)}</span>
      </div>
      <div className="mt-1 grid gap-1" aria-hidden="true">
        <Barra faixa="Sugestão" valor={sugestao} maximo={maximo} tom="accent" />
        <Barra faixa="Real" valor={real} maximo={maximo} tom={invertida ? "outflow" : "inflow"} />
      </div>
      <p className="mt-1 text-xs text-mute">
        Real {formatarMoeda(real)} · sugestão {formatarMoeda(sugestao)}
      </p>
    </div>
  );
}

function Barra({
  faixa,
  valor,
  maximo,
  tom,
}: {
  faixa: string;
  valor: number;
  maximo: number;
  tom: "inflow" | "outflow" | "accent";
}) {
  const largura = Math.min(100, (Math.abs(valor) / maximo) * 100);
  const cor = tom === "inflow" ? "bg-inflow" : tom === "outflow" ? "bg-outflow" : "bg-accent";
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] text-mute">{faixa}</span>
      <div className="h-1.5 flex-1 bg-line/70">
        <div className={`h-1.5 ${cor}`} style={{ width: `${largura}%` }} />
      </div>
    </div>
  );
}
