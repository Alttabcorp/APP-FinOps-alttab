"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  rotulo: string;
  ativo: (path: string) => boolean;
};

const ITENS: Item[] = [
  { href: "/", rotulo: "Início", ativo: (path) => path === "/" },
  { href: "/investimentos", rotulo: "Investimentos", ativo: (path) => path.startsWith("/investimentos") },
  {
    href: "/acompanhar",
    rotulo: "Acompanhar",
    ativo: (path) => path.startsWith("/acompanhar") || path.startsWith("/historico"),
  },
  {
    href: "/dashboard",
    rotulo: "Números",
    ativo: (path) => path.startsWith("/dashboard"),
  },
  {
    href: "/cadastros",
    rotulo: "Cadastros",
    ativo: (path) =>
      path.startsWith("/cadastros") ||
      path.startsWith("/entradas") ||
      path.startsWith("/gastos") ||
      path.startsWith("/contas") ||
      path.startsWith("/empresa") ||
      path.startsWith("/cartao") ||
      path.startsWith("/anuais") ||
      path.startsWith("/rendas") ||
      path.startsWith("/rendimentos"),
  },
];

export function Navegacao() {
  const path = usePathname();

  return (
    <nav aria-label="Principal">
      <ul className="nav-grupo">
        {ITENS.map((item) => {
          const ativo = item.ativo(path);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={ativo ? "page" : undefined} className="nav-link">
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
