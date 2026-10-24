"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/", rotulo: "Início", ativo: (path: string) => path === "/" },
  {
    href: "/entradas",
    rotulo: "Entradas",
    ativo: (path: string) =>
      path.startsWith("/entradas") || path.startsWith("/rendimentos") || path.startsWith("/rendas"),
  },
  { href: "/gastos", rotulo: "Gastos", ativo: (path: string) => path.startsWith("/gastos") },
  { href: "/investimentos", rotulo: "Investimentos", ativo: (path: string) => path.startsWith("/investimentos") },
  { href: "/contas", rotulo: "Contas", ativo: (path: string) => path.startsWith("/contas") },
  { href: "/empresa", rotulo: "Empresa", ativo: (path: string) => path.startsWith("/empresa") },
  { href: "/cartao", rotulo: "Cartão", ativo: (path: string) => path.startsWith("/cartao") },
];

export function Navegacao() {
  const path = usePathname();

  return (
    <nav aria-label="Principal" className="flex flex-wrap gap-1 lg:flex-col">
      {ITENS.map((item) => {
        const ativo = item.ativo(path);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className="nav-link"
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
