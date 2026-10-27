"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/entradas", rotulo: "Fontes" },
  { href: "/gastos", rotulo: "Contas" },
  { href: "/cartao", rotulo: "Cartão" },
  { href: "/contas", rotulo: "Meta" },
  { href: "/empresa", rotulo: "Empresa" },
] as const;

export function NavCadastros() {
  const path = usePathname();

  return (
    <nav className="nav-cadastros" aria-label="Cadastros">
      {ITENS.map((item) => {
        const ativo = path.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={ativo ? "page" : undefined}>
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
