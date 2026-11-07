"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/", rotulo: "Início", icone: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" },
  { href: "/ganhos", rotulo: "Ganhos", icone: "M12 19V5M5.5 11.5 12 5l6.5 6.5" },
  { href: "/despesas", rotulo: "Gastos", icone: "M12 5v14M5.5 12.5 12 19l6.5-6.5" },
  { href: "/cartao", rotulo: "Cartão", icone: "M3.5 7.5h17v10h-17zM3.5 11h17" },
  { href: "/objetivos", rotulo: "Objetivos", icone: "M12 4v16M12 4h7l-2 3.5 2 3.5h-7" },
  { href: "/transacoes", rotulo: "Histórico", icone: "M5 6h14M5 12h14M5 18h9", soDesktop: true },
] as const;

const ativo = (caminho: string, href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

function Icone({ d }: { d: string }) {
  return (
    <svg className="nav-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Barra de abas no celular e menu lateral no desktop. */
export function Navegacao({ variante }: { variante: "lateral" | "inferior" }) {
  const caminho = usePathname() ?? "/";
  const itens = variante === "inferior" ? ITENS.filter((item) => !("soDesktop" in item && item.soDesktop)) : ITENS;
  return (
    <nav aria-label="Principal" className={variante === "lateral" ? "nav-lateral" : "nav-inferior"}>
      {itens.map((item) => (
        <Link key={item.href} href={item.href} aria-current={ativo(caminho, item.href) ? "page" : undefined} className="nav-item">
          <Icone d={item.icone} />
          <span>{item.rotulo}</span>
        </Link>
      ))}
    </nav>
  );
}
