import { PaginaFolhaMes } from "@/components/pagina-folha-mes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ competencia: string }>;
};

export default async function PaginaMes({ params }: Props) {
  const { competencia } = await params;
  return <PaginaFolhaMes competencia={competencia} aba="visao" />;
}
