import { PainelAnuais } from "@/components/painel-anuais";
import { PainelContas } from "@/components/painel-contas";
import { PainelGastoEmpresa } from "@/components/painel-gasto-empresa";
import { listarContasAnuais } from "@/lib/application/anual-service";
import { listarContas } from "@/lib/application/conta-service";
import { listarGastosEmpresa } from "@/lib/application/gasto-empresa-service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function PaginaEmpresa({ searchParams }: Props) {
  const { novo } = await searchParams;
  const [todas, anuais, gastos] = await Promise.all([
    listarContas(),
    listarContasAnuais(),
    listarGastosEmpresa(),
  ]);
  const contas = todas.filter((conta) => conta.finalidade === "EMPRESA");
  const contasAnuais = anuais.filter((conta) => conta.lado === "EMPRESA");

  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <header>
        <h1 className="titulo">
          Empresa
        </h1>
        <p className="mt-2 max-w-[42ch] text-sm text-mute">
          Dinheiro para investir na empresa. Anote cada retirada e em que foi gasto.
        </p>
      </header>
      <div className="mt-8">
        <PainelContas
          contas={contas}
          finalidades={["EMPRESA"]}
          finalidadePadrao="EMPRESA"
          abrirNovo={novo === "conta"}
          vazio="Nenhuma conta da empresa ainda. Cadastre o saldo do investimento da empresa."
        />
      </div>
      <section className="mt-12">
        <h2 className="titulo-secao">Gastos da empresa</h2>
        <p className="mt-1 max-w-[42ch] text-sm text-mute">
          O valor sai da conta da empresa. Fica registrado o que foi comprado.
        </p>
        <div className="mt-4">
          <PainelGastoEmpresa contasEmpresa={contas} gastos={gastos} abrirNovo={novo === "gasto"} />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="titulo-secao">Contas anuais da empresa</h2>
        <p className="mt-1 max-w-[42ch] text-sm text-mute">
          Informe a data de cobrança. Dá para dividir o valor até esse dia.
        </p>
        <div className="mt-4">
          <PainelAnuais contas={contasAnuais} lado="EMPRESA" abrirNovo={novo === "anual"} />
        </div>
      </section>
    </main>
  );
}
