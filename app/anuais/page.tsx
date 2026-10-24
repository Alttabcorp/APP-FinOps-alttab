import { PainelAnuais } from "@/components/painel-anuais";
import { listarContasAnuais } from "@/lib/application/anual-service";

export const dynamic = "force-dynamic";

export default async function PaginaAnuais() {
  const contas = await listarContasAnuais();

  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <header>
        <h1 className="titulo">
          Contas anuais
        </h1>
        <p className="mt-2 max-w-[42ch] text-sm text-mute">
          IPTU, IPVA, domínio, máquina virtual. Informe a data de cobrança e, se quiser, divida até essa data.
        </p>
      </header>
      <div className="mt-8">
        <PainelAnuais contas={contas} />
      </div>
    </main>
  );
}
