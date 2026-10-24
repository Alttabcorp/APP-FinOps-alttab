import Link from "next/link";
import { caminhoFolha } from "@/components/abas-folha";
import type { EtapaPrioridade, IdPrioridade } from "@/lib/domain/financeiro/prioridade";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  etapas: EtapaPrioridade[];
  competencia: string;
  contasPagas?: number;
  contasTotal?: number;
};

const DESTINO: Record<IdPrioridade, (competencia: string) => string> = {
  contas: (competencia) => caminhoFolha(competencia, "pagar"),
  cartao: () => "/cartao",
  poupanca: () => "/investimentos",
  feira: (competencia) => caminhoFolha(competencia, "gastos"),
  investimento: () => "/investimentos",
  pessoal: (competencia) => caminhoFolha(competencia, "gastos"),
  reposicao: () => "/contas",
  meta: () => "/contas",
};

export function FaixaPrioridade({ etapas, competencia, contasPagas, contasTotal }: Props) {
  return (
    <section className="capitulo">
      <header>
        <h2 className="titulo-secao">Ordem do caixa</h2>
        <p className="mt-1 max-w-[46ch] text-sm text-mute">
          Contas, cartão, poupança, feira, investimento, gasto pessoal. O que saiu da meta volta antes do extra.
        </p>
      </header>
      <ol className="mt-5 grid gap-0">
        {etapas.map((etapa) => (
          <li key={etapa.id} className="border-t border-line">
            <Link
              href={DESTINO[etapa.id](competencia)}
              className="flex items-baseline justify-between gap-4 py-3 hover:bg-sheet"
            >
              <span className="flex min-w-0 items-baseline gap-3">
                <span className="money w-5 shrink-0 text-sm text-mute">{etapa.ordem}</span>
                <span>
                  <span className="block font-medium">{etapa.rotulo}</span>
                  <span className="mt-0.5 block text-sm text-mute">{detalhe(etapa, contasPagas, contasTotal)}</span>
                </span>
              </span>
              <span
                className={`money shrink-0 text-sm font-medium ${
                  etapa.status === "falta" ? "text-outflow" : etapa.status === "ok" ? "text-inflow" : "text-mute"
                }`}
              >
                {valorEtapa(etapa)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function detalhe(etapa: EtapaPrioridade, contasPagas?: number, contasTotal?: number) {
  if (etapa.id === "contas" && contasTotal != null && contasTotal > 0) {
    return `${contasPagas ?? 0} de ${contasTotal} ${contasTotal === 1 ? "paga" : "pagas"}`;
  }
  if (etapa.id === "feira" && etapa.status === "ok") return "Cobre com o vale-alimentação, se houver.";
  if (etapa.id === "pessoal" && etapa.status === "vazio") return "Não sobrou para gasto pessoal.";
  if (etapa.id === "pessoal") return "Fora as contas da casa.";
  if (etapa.id === "reposicao" && etapa.status === "vazio") return "Nada a devolver à meta neste mês.";
  if (etapa.id === "reposicao" && etapa.status === "falta") return `Faltam ${formatarMoeda(etapa.falta)} para repor o saque.`;
  if (etapa.id === "reposicao") return "Parcela do que você tirou da meta para pagar à vista.";
  if (etapa.id === "meta" && etapa.status === "vazio") return "Não sobrou para a meta nem para mais investimento.";
  if (etapa.id === "meta") return "O que restou depois de devolver à meta.";
  if (etapa.status === "falta") return `Faltam ${formatarMoeda(etapa.falta)}`;
  if (etapa.status === "vazio") return "Nada neste mês";
  return "Coberto";
}

function valorEtapa(etapa: EtapaPrioridade) {
  if (etapa.id === "meta" || etapa.id === "pessoal") return formatarMoeda(etapa.coberto);
  if (etapa.id === "reposicao") return formatarMoeda(etapa.precisa);
  if (etapa.status === "vazio") return formatarMoeda(0);
  return formatarMoeda(etapa.precisa);
}
