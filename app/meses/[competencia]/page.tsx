import { redirect } from "next/navigation";
import { isCompetencia } from "@/lib/domain/financeiro/competencia";

type Props = { params: Promise<{ competencia: string }> };

/** A antiga página "Detalhes do mês" foi substituída pelas páginas de ganhos, gastos, cartão e objetivos. */
export default async function PaginaMes({ params }: Props) {
  const { competencia } = await params;
  redirect(isCompetencia(competencia) ? `/?mes=${competencia}` : "/");
}
