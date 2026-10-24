import { PainelAnuais } from "@/components/painel-anuais";
import { PainelContas } from "@/components/painel-contas";
import { PainelEmprestimoMeta } from "@/components/painel-emprestimo-meta";
import { listarContasAnuais } from "@/lib/application/anual-service";
import { listarContas } from "@/lib/application/conta-service";
import { listarEmprestimosMeta } from "@/lib/application/emprestimo-meta-service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function PaginaContas({ searchParams }: Props) {
  const { novo } = await searchParams;
  const [todas, anuais, emprestimos] = await Promise.all([
    listarContas(),
    listarContasAnuais(),
    listarEmprestimosMeta(),
  ]);
  const contas = todas.filter((conta) => conta.finalidade === "META" || conta.finalidade === "RESERVA");
  const contasMeta = contas.filter((conta) => conta.finalidade === "META");
  const contasAnuais = anuais.filter((conta) => conta.lado === "CASA");

  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-6 pb-16 lg:px-8 lg:py-8">
      <header>
        <h1 className="titulo">
          Contas
        </h1>
        <p className="mt-2 max-w-[42ch] text-sm text-mute">
          Meta de R$ 10.000 para viagem e móveis. Dá para sacar à vista e devolver aos poucos, sem cartão.
        </p>
      </header>
      <div className="mt-8">
        <PainelContas
          contas={contas}
          finalidades={["META", "RESERVA"]}
          finalidadePadrao="META"
          abrirNovo={novo === "conta"}
          vazio="Nenhuma meta ou reserva ainda. Cadastre o saldo e o objetivo."
        />
      </div>
      <section className="mt-12">
        <h2 className="titulo-secao">Compra à vista com a meta</h2>
        <p className="mt-1 max-w-[42ch] text-sm text-mute">
          O dinheiro sai da meta. Você fica devendo para si e vai repondo no ritmo das parcelas.
        </p>
        <div className="mt-4">
          <PainelEmprestimoMeta
            emprestimos={emprestimos}
            contasMeta={contasMeta}
            abrirNovo={novo === "saque"}
          />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="titulo-secao">Contas anuais da casa</h2>
        <p className="mt-1 max-w-[42ch] text-sm text-mute">
          Informe a data de cobrança. Dá para dividir o valor até esse dia.
        </p>
        <div className="mt-4">
          <PainelAnuais contas={contasAnuais} lado="CASA" abrirNovo={novo === "anual"} />
        </div>
      </section>
    </main>
  );
}
