import { irParaAba } from "@/lib/ui/rota-aba";

type Props = {
  searchParams: Promise<{ mes?: string; novo?: string }>;
};

export default async function Pagina({ searchParams }: Props) {
  const { mes, novo } = await searchParams;
  irParaAba("entradas", mes, novo);
}
