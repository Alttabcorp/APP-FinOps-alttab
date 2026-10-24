import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ competencia: string }>;
};

export default async function PaginaEntradasDoMes({ params }: Props) {
  const { competencia } = await params;
  redirect(`/entradas?mes=${encodeURIComponent(competencia)}`);
}
