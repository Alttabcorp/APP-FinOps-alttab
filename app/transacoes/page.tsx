import Link from "next/link";
import { BotaoEntrada } from "@/components/botao-entrada";
import { listarContas } from "@/lib/application/conta-service";
import {
  competenciasComTransacao,
  listarTransacoes,
  ROTULOS_TRANSACAO,
} from "@/lib/application/transacao-service";
import { formatarCompetencia, isCompetencia } from "@/lib/domain/financeiro/competencia";
import { formatarMoeda } from "@/lib/formatacao";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ conta?: string; mes?: string }> };

const formatarData = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));

export default async function PaginaTransacoes({ searchParams }: Props) {
  const { conta, mes } = await searchParams;
  const [contas, meses] = await Promise.all([listarContas(), competenciasComTransacao()]);
  const contaId = contas.some((item) => item.id === conta) ? conta : undefined;
  const competencia = mes && isCompetencia(mes) ? mes : undefined;
  const transacoes = await listarTransacoes({ contaId, competencia });

  const entrou = transacoes.filter((t) => t.valor > 0).reduce((acc, t) => acc + t.valor, 0);
  const saiu = transacoes.filter((t) => t.valor < 0).reduce((acc, t) => acc + t.valor, 0);

  return (
    <main id="conteudo">
      <article className="mx-auto max-w-[72rem] px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="titulo">Transações</h1>
            <p className="mt-2 max-w-[60ch] text-sm text-mute">
              Tudo que entrou e saiu das suas caixinhas: depósitos, retiradas, reposições e ajustes de saldo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BotaoEntrada
              contas={contas.map((item) => ({ id: item.id, nome: item.nome }))}
              className="btn-primary"
              rotulo="Nova entrada"
            />
            <Link className="btn" href="/objetivos">
              Objetivos
            </Link>
            <Link className="btn" href="/">
              Início
            </Link>
          </div>
        </header>

        <form method="get" className="transacoes-filtro" aria-label="Filtrar transações">
          <label className="campo">
            <span className="campo-label">Caixinha</span>
            <select name="conta" className="field" defaultValue={contaId ?? ""}>
              <option value="">Todas</option>
              {contas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="campo-label">Mês</span>
            <select name="mes" className="field" defaultValue={competencia ?? ""}>
              <option value="">Todos</option>
              {meses.map((item) => (
                <option key={item} value={item}>
                  {formatarCompetencia(item)}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary" type="submit">
            Filtrar
          </button>
          {contaId || competencia ? (
            <Link className="btn" href="/transacoes">
              Limpar
            </Link>
          ) : null}
        </form>

        <section className="resumo-faixa mt-5" aria-label="Resumo das transações">
          <div className="resumo-celula">
            <p className="kpi-rotulo">Entrou</p>
            <p className="money resumo-valor-sm text-inflow">{formatarMoeda(entrou)}</p>
          </div>
          <div className="resumo-celula">
            <p className="kpi-rotulo">Saiu</p>
            <p className="money resumo-valor-sm text-outflow">{formatarMoeda(Math.abs(saiu))}</p>
          </div>
          <div className="resumo-celula">
            <p className="kpi-rotulo">Saldo do período</p>
            <p className={`money resumo-valor-sm ${entrou + saiu >= 0 ? "text-inflow" : "text-outflow"}`}>
              {formatarMoeda(entrou + saiu)}
            </p>
          </div>
        </section>

        <section className="panel mt-6 p-5" aria-label="Lista de transações">
          {transacoes.length === 0 ? (
            <p className="text-sm text-mute">Nenhuma transação encontrada.</p>
          ) : (
            <ul>
              {transacoes.map((t) => (
                <li key={t.id} className="transacao-linha">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.descricao}</p>
                    <p className="text-xs text-mute">
                      {t.contaNome} · {ROTULOS_TRANSACAO[t.tipo] ?? t.tipo} · {formatarData(t.data)}
                    </p>
                  </div>
                  <p className={`money shrink-0 font-medium ${t.valor >= 0 ? "text-inflow" : "text-outflow"}`}>
                    {t.valor >= 0 ? "+" : "−"} {formatarMoeda(Math.abs(t.valor))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </main>
  );
}
