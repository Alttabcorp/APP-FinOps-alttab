import { PainelCartao } from "@/components/painel-cartao";
import { listarComprasCartao } from "@/lib/application/cartao-service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function PaginaCartao({ searchParams }: Props) {
  const { novo } = await searchParams;
  const compras = await listarComprasCartao();

  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <header>
        <h1 className="titulo">
          Cartão
        </h1>
        <p className="mt-2 max-w-[42ch] text-sm text-mute">
          Cadastre compras parceladas. A fatura de cada mês soma as parcelas daquele mês.
        </p>
      </header>
      <div className="mt-8">
        <PainelCartao compras={compras} abrirNovo={novo === "1"} />
      </div>
    </main>
  );
}
