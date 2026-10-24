import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ competencia: string }>;
};

export default async function PaginaGastosDoMes({ params }: Props) {
  const { competencia } = await params;
  redirect(`/gastos?mes=${encodeURIComponent(competencia)}`);
}
