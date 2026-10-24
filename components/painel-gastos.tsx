import type { carregarGastos } from "@/lib/application/carregar-gastos";
import { formatarCompetenciaCurta } from "@/lib/domain/financeiro/competencia";
import {
  agruparGastosDoMes,
  CATEGORIAS_PERGUNTA,
  ROTULOS_CATEGORIA_GASTO,
} from "@/lib/domain/financeiro/gasto";
import { formatarMoeda, formatarPercentual } from "@/lib/formatacao";

type Dados = NonNullable<Awaited<ReturnType<typeof carregarGastos>>>;

type Props = {
  dados: Dados;
};

export function RelatorioGastos({ dados }: Props) {
  const { analise, resultado } = dados;
  const maximo = Math.max(...analise.ranking.map((linha) => linha.valor), 1);

  return (
    <div className="grid gap-8">
      {analise.pistas.length > 0 ? (
        <section aria-label="Onde dá para olhar">
          <h3 className="font-medium">Onde dá para olhar</h3>
          <ul className="mt-3 grid gap-2">
            {analise.pistas.map((pista) => (
              <li key={pista.id} className="border-t border-line pt-2 text-sm">
                {pista.texto}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="font-medium">Ranking deste mês</h3>
        <p className="mt-1 text-sm text-mute">Do que mais saiu para o que menos saiu. Aporte fica de fora.</p>
        {analise.ranking.length === 0 ? (
          <p className="mt-3 text-sm text-mute">Nada para ranquear ainda.</p>
        ) : (
          <ul className="mt-4 grid gap-3" aria-label="Gastos do mês do maior para o menor">
            {analise.ranking.map((linha) => (
              <li key={linha.categoria}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{linha.rotulo}</span>
                  <span className="money font-medium">
                    {formatarMoeda(linha.valor)}
                    <span className="ml-2 text-mute">{formatarPercentual(linha.percentual)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 bg-line/70" aria-hidden="true">
                  <div className="h-2 bg-outflow" style={{ width: `${(linha.valor / maximo) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-x-auto">
        <h3 className="font-medium">Meses anteriores</h3>
        <p className="mt-1 text-sm text-mute">As mesmas perguntas, mês a mês.</p>
        {dados.historico.length === 0 ? (
          <p className="mt-3 text-sm text-mute">Ainda não há meses para comparar.</p>
        ) : (
          <table className="mt-4 min-w-full text-left text-sm">
            <caption className="sr-only">Gastos por categoria nos últimos meses</caption>
            <thead>
              <tr className="text-mute">
                <th className="pb-2 pr-4 font-medium" scope="col">
                  Tipo
                </th>
                {dados.historico.map((mes) => (
                  <th key={mes.competencia} className="pb-2 pr-4 font-medium" scope="col">
                    {formatarCompetenciaCurta(mes.competencia)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIAS_PERGUNTA.map((categoria) => (
                <tr key={categoria} className="border-t border-line">
                  <th className="py-2.5 pr-4 font-medium" scope="row">
                    {ROTULOS_CATEGORIA_GASTO[categoria]}
                  </th>
                  {dados.historico.map((mes) => {
                    const valor = agruparGastosDoMes(mes.entrada).get(categoria)?.valor ?? 0;
                    return (
                      <td key={`${mes.competencia}-${categoria}`} className="money py-2.5 pr-4">
                        {valor > 0.005 ? formatarMoeda(valor) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-mute">
        Total do mês, com investimento, {formatarMoeda(resultado.resumo.gasto)}. O ranking ignora aporte.
      </p>
    </div>
  );
}
