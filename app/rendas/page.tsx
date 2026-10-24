import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function PaginaRendas({ searchParams }: Props) {
  const { novo } = await searchParams;
  redirect(novo ? `/entradas?novo=${encodeURIComponent(novo)}` : "/entradas");
}
