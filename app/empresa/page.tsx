import { CabecaPagina } from "@/components/cabeca-pagina";
import { NavCadastros } from "@/components/nav-cadastros";
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
    <main id="conteudo" className="pagina">
      <NavCadastros />
      <CabecaPagina
        titulo="Empresa"
        nota="Saldo da Alttab. O depósito do mês se lança no Início. Aqui: estoque, retirada e anuais."
      />
      <PainelContas
        contas={contas}
        finalidades={["EMPRESA"]}
        finalidadePadrao="EMPRESA"
        abrirNovo={novo === "conta"}
        titulo="Conta da empresa"
        nota="O estoque. Gasto da empresa sai daqui."
        rotuloTotal="Na empresa"
        vazio="Nenhuma conta da empresa ainda. Cadastre o saldo do investimento da empresa."
      />
      <PainelGastoEmpresa
        contasEmpresa={contas}
        gastos={gastos}
        abrirNovo={novo === "gasto"}
        titulo="Gastos da empresa"
        nota="O valor sai da conta da empresa. Fica registrado o que foi comprado."
      />
      <PainelAnuais
        contas={contasAnuais}
        lado="EMPRESA"
        abrirNovo={novo === "anual"}
        titulo="Contas anuais da empresa"
        nota="Domínio, máquina virtual. O sistema sugere guardar um pedaço todo mês até o pagamento."
      />
    </main>
  );
}
