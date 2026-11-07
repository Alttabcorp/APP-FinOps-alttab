import { redirect } from "next/navigation";
import { competenciaAtual, isCompetencia } from "@/lib/domain/financeiro/competencia";

type Aba = "entradas" | "gastos" | "investimentos" | "cartao";

const DESTINO: Record<Aba, string> = {
  entradas: "/ganhos",
  gastos: "/despesas",
  investimentos: "/objetivos",
  cartao: "/cartao",
};

/** Telas antigas foram trocadas pelas páginas novas: redireciona mantendo o mês. */
export function irParaAba(aba: Aba, mes?: string, _novo?: string): never {
  const competencia = mes && isCompetencia(mes) ? mes : competenciaAtual();
  redirect(`${DESTINO[aba]}?mes=${competencia}`);
}
