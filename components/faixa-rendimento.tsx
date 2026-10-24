import type { DestinoRendimento } from "@/lib/domain/financeiro/rendimento";
import { formatarMoeda } from "@/lib/formatacao";

type Props = {
  destino: DestinoRendimento;
};

export function FaixaRendimento({ destino }: Props) {
  if (destino.total < 0.005) return null;

  return (
    <section className="capitulo">
      <header>
        <h2 className="titulo-secao">Rendimento</h2>
        <p className="mt-1 max-w-[46ch] text-sm text-mute">
          {destino.apertado
            ? "Mês apertado. O rendimento entra nas contas que faltam; o resto reinveste."
            : "O caixa cobriu as contas. O rendimento volta para o investimento e a poupança."}
        </p>
      </header>
      <ul className="mt-5">
        <li className="flex items-baseline justify-between gap-4 border-t border-line py-3">
          <span>
            <span className="block font-medium">Nas contas</span>
            <span className="mt-0.5 block text-sm text-mute">
              {destino.paraContas < 0.005
                ? "Não precisou deste mês."
                : destino.apertado
                  ? `Faltavam ${formatarMoeda(destino.faltaSemRendimento)} sem o rendimento.`
                  : "Não usou."}
            </span>
          </span>
          <span className={`money text-sm font-medium ${destino.paraContas >= 0.005 ? "text-outflow" : "text-mute"}`}>
            {formatarMoeda(destino.paraContas)}
          </span>
        </li>
        <li className="flex items-baseline justify-between gap-4 border-t border-line py-3">
          <span>
            <span className="block font-medium">Reinvestido</span>
            <span className="mt-0.5 block text-sm text-mute">{detalheReinvestido(destino)}</span>
          </span>
          <span className={`money text-sm font-medium ${destino.reinvestido >= 0.005 ? "text-inflow" : "text-mute"}`}>
            {formatarMoeda(destino.reinvestido)}
          </span>
        </li>
      </ul>
    </section>
  );
}

function detalheReinvestido(destino: DestinoRendimento) {
  const partes: string[] = [];
  if (destino.reinvestidoFundo >= 0.005) {
    partes.push(`investimento ${formatarMoeda(destino.reinvestidoFundo)}`);
  }
  if (destino.reinvestidoPoupanca >= 0.005) {
    partes.push(`poupança ${formatarMoeda(destino.reinvestidoPoupanca)}`);
  }
  if (partes.length === 0) return "Tudo foi para as contas.";
  return partes.join(" · ");
}
