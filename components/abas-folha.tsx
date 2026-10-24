import Link from "next/link";
import { formatarMoeda } from "@/lib/formatacao";

export const ABAS_FOLHA = [
  { id: "visao", rotulo: "Fechar o mês" },
  { id: "entradas", rotulo: "Entradas" },
  { id: "gastos", rotulo: "Gastos" },
] as const;

export type AbaFolha = "visao" | "entradas" | "pagar" | "gastos";

export function caminhoFolha(competencia: string, aba: AbaFolha) {
  if (aba === "entradas") return "/entradas";
  if (aba === "pagar" || aba === "gastos") return "/gastos";
  return `/meses/${competencia}`;
}

export function AbasFolha({ competencia, aba }: { competencia: string; aba: AbaFolha }) {
  const itens = [
    { id: "visao" as const, rotulo: "Fechar o mês", href: `/meses/${competencia}` },
    { id: "entradas" as const, rotulo: "Entradas", href: "/entradas" },
    { id: "gastos" as const, rotulo: "Gastos", href: "/gastos" },
    { id: "investimentos" as const, rotulo: "Investimentos", href: "/investimentos" },
  ];
  const atual = aba === "pagar" ? "gastos" : aba;

  return (
    <nav aria-label="Trabalho do mês" className="folha-abas">
      {itens.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={item.id === atual ? "page" : undefined}
          className="folha-aba"
        >
          {item.rotulo}
        </Link>
      ))}
    </nav>
  );
}

export function AtalhosFolha({
  ganhou,
  gastos,
  aporte,
}: {
  competencia?: string;
  ganhou: number;
  pagas?: number;
  totalPagar?: number;
  gastos: number;
  aporte?: number;
}) {
  const atalhos = [
    { href: "/entradas", rotulo: "Entradas", detalhe: formatarMoeda(ganhou) },
    { href: "/gastos", rotulo: "Gastos", detalhe: formatarMoeda(gastos) },
    {
      href: "/investimentos",
      rotulo: "Investimentos",
      detalhe: formatarMoeda(aporte ?? 0),
    },
  ];

  return (
    <nav aria-label="Abrir o trabalho do mês" className="panel overflow-hidden p-0">
      {atalhos.map((atalho, indice) => (
        <Link
          key={atalho.href}
          href={atalho.href}
          className={`flex items-baseline justify-between gap-4 px-5 py-4 hover:bg-sheet ${
            indice > 0 ? "border-t border-line" : ""
          }`}
        >
          <span>{atalho.rotulo}</span>
          <span className="money text-sm text-mute">{atalho.detalhe}</span>
        </Link>
      ))}
    </nav>
  );
}
