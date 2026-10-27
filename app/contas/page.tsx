import { CabecaPagina } from "@/components/cabeca-pagina";
import { NavCadastros } from "@/components/nav-cadastros";
import { PainelAnuais } from "@/components/painel-anuais";
import { PainelContas } from "@/components/painel-contas";
import { PainelEmprestimoMeta } from "@/components/painel-emprestimo-meta";
import { listarContasAnuais } from "@/lib/application/anual-service";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { listarContas } from "@/lib/application/conta-service";
import { listarEmprestimosMeta } from "@/lib/application/emprestimo-meta-service";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function PaginaContas({ searchParams }: Props) {
  const { novo } = await searchParams;
  const [todas, anuais, emprestimos, folha] = await Promise.all([
    listarContas(),
    listarContasAnuais(),
    listarEmprestimosMeta(),
    carregarFolha(competenciaAtual()),
  ]);
  const contas = todas.filter((conta) => conta.finalidade === "META" || conta.finalidade === "RESERVA");
  const emprestimosConta = emprestimos.filter(
    (emprestimo) => emprestimo.contaFinalidade === "META" || emprestimo.contaFinalidade === "RESERVA",
  );
  const contasAnuais = anuais.filter((conta) => conta.lado === "CASA");
  const sobraMes = folha?.resultado.distribuicao.metaFinal ?? 0;

  return (
    <main id="conteudo" className="pagina">
      <NavCadastros />
      <CabecaPagina
        titulo="Meta"
        nota="Objetivo de R$ 10.000. Se sacarem da reserva ou da meta, o sistema sugere parcelas para repor."
      />
      <PainelContas
        contas={contas}
        finalidades={["META", "RESERVA"]}
        finalidadePadrao="META"
        abrirNovo={novo === "conta"}
        titulo="Saldo"
        nota="A meta e a reserva de hoje."
        vazio="Nenhuma meta ou reserva ainda. Cadastre o saldo e o objetivo."
      />
      <PainelEmprestimoMeta
        emprestimos={emprestimosConta}
        contas={contas}
        sobraMes={sobraMes}
        abrirNovo={novo === "saque"}
        titulo="Retirada"
        nota="O dinheiro sai agora. As parcelas devolvem o valor no ritmo que cabe neste mês."
      />
      <PainelAnuais
        contas={contasAnuais}
        lado="CASA"
        abrirNovo={novo === "anual"}
        titulo="Contas anuais da casa"
        nota="IPTU, IPVA. O sistema sugere guardar um pedaço todo mês até o dia do pagamento."
      />
    </main>
  );
}
