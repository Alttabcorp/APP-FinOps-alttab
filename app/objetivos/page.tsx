import Link from "next/link";
import { PainelObjetivos } from "@/components/painel-objetivos";
import { listarContasAnuais } from "@/lib/application/anual-service";
import { carregarFolha } from "@/lib/application/carregar-folha";
import { listarContas } from "@/lib/application/conta-service";
import { listarGastosEmpresa } from "@/lib/application/gasto-empresa-service";
import { formatarDataCobranca } from "@/lib/domain/financeiro/anual";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";

export const dynamic = "force-dynamic";

const MESES_RESERVA = 6;

export default async function PaginaObjetivos() {
  const [contas, anuais, folha, gastosEmpresa] = await Promise.all([
    listarContas(),
    listarContasAnuais(),
    carregarFolha(competenciaAtual()),
    listarGastosEmpresa(),
  ]);

  // Gasto mensal real: contas (fixas, avulsas, anuais), feira, gasolina e fatura do cartão. Não inclui aportes.
  const gastoReal = (par: { real: number; sugestao: number }) => (par.real > 0.005 ? par.real : par.sugestao);
  const essenciaisMes = folha
    ? folha.resultado.gastoMensal +
      gastoReal(folha.resultado.despesasVariaveis.feira) +
      gastoReal(folha.resultado.despesasVariaveis.gasolina) +
      folha.faturaCartao +
      folha.cartaoFixo +
      folha.dto.cartaoReal
    : 0;
  const daCasa = anuais.filter((conta) => conta.lado === "CASA");
  const totalAnual = daCasa.reduce((acc, conta) => acc + conta.valor, 0);

  return (
    <main id="conteudo">
      <article className="mx-auto max-w-[72rem] px-4 py-6 pb-28 lg:px-8 lg:py-8 lg:pb-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="titulo">Objetivos</h1>
            <p className="mt-2 max-w-[60ch] text-sm text-mute">
              Seu dinheiro em cinco caixas, cada uma com uma função: segurança, previsibilidade, empresa, renda futura
              e realizações.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href="/transacoes">
              Transações
            </Link>
            <Link className="btn" href="/">
              Voltar ao início
            </Link>
          </div>
        </header>
        <PainelObjetivos
          contas={contas}
          competencia={competenciaAtual()}
          emprestimos={folha?.emprestimosMeta ?? []}
          sobraMes={folha && folha.resultado.resumo.sobrou > 0 ? folha.resultado.distribuicao.metaFinal : 0}
          gastosEmpresa={gastosEmpresa}
          rendimento={{
            total: folha?.resultado.rendimento.total ?? 0,
            apertado: folha?.resultado.rendimento.apertado ?? false,
            paraContas: folha?.resultado.rendimento.paraContas ?? 0,
            reinvestido: folha?.resultado.rendimento.reinvestido ?? 0,
          }}
          essenciaisMes={essenciaisMes}
          mesesReserva={MESES_RESERVA}
          anuais={{
            total: totalAnual,
            porMes: Math.round((totalAnual / 12) * 100) / 100,
            itens: daCasa.map((conta) => ({
              id: conta.id,
              nome: conta.nome,
              valor: conta.valor,
              quando: formatarDataCobranca(conta.dia, conta.mes),
            })),
          }}
        />
      </article>
    </main>
  );
}
