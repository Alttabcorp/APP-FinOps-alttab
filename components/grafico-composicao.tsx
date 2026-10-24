import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  ganhou: number;
  gasto: number;
  investido: number;
  sobrou: number;
};

const LINHAS = [
  { chave: "ganhou" as const, rotulo: "Ganhou", trilha: "h-2 bg-inflow" },
  { chave: "gasto" as const, rotulo: "Gastou", trilha: "h-2 bg-outflow" },
  { chave: "investido" as const, rotulo: "Investiu", trilha: "h-2 bg-accent" },
  { chave: "sobrou" as const, rotulo: "Sobrou", trilha: "h-2 bg-ink" },
];

export function GraficoComposicao({ ganhou, gasto, investido, sobrou }: Props) {
  const valores = { ganhou, gasto, investido, sobrou };
  const maximo = Math.max(ganhou, gasto, investido, Math.abs(sobrou), 1);

  return (
    <ul
      className="grid gap-3"
      aria-label={`Neste mês ganhou ${formatarMoeda(ganhou)}, gastou ${formatarMoeda(gasto)}, investiu ${formatarMoeda(investido)} e sobrou ${formatarMoeda(sobrou)}`}
    >
      {LINHAS.map((linha) => {
        const valor = valores[linha.chave];
        const percentual = Math.min(100, (Math.abs(valor) / maximo) * 100);
        return (
          <li key={linha.chave}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-mute">{linha.rotulo}</span>
              <span className={`money font-medium ${valor < 0 ? "text-outflow" : ""}`}>
                {formatarMoeda(valor)}
              </span>
            </div>
            <div className="mt-1.5 h-2 bg-line/70" aria-hidden="true">
              <div
                className={valor < 0 ? "h-2 bg-outflow" : linha.trilha}
                style={{ width: `${percentual}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
