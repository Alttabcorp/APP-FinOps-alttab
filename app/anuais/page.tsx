import { CabecaPagina } from "@/components/cabeca-pagina";
import { NavCadastros } from "@/components/nav-cadastros";
import { PainelAnuais } from "@/components/painel-anuais";
import { listarContasAnuais } from "@/lib/application/anual-service";

export const dynamic = "force-dynamic";

export default async function PaginaAnuais() {
  const contas = await listarContasAnuais();

  return (
    <main id="conteudo" className="pagina">
      <NavCadastros />
      <CabecaPagina
        titulo="Contas anuais"
        nota="IPTU, IPVA, domínio. O sistema sugere guardar um pedaço todo mês, para no dia do pagamento o valor já estar junto."
      />
      <PainelAnuais contas={contas} titulo="Reservas do ano" />
    </main>
  );
}
