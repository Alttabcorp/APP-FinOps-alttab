import Link from "next/link";
import { Navegacao } from "@/components/navegacao";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="spine spine-desktop">
        <div className="min-w-0">
          <Link href="/" className="block text-inherit no-underline">
            <span className="spine-logo" aria-hidden="true" />
            <p className="spine-marca">Alttab FinOps</p>
            <p className="spine-titulo">Contas da casa</p>
          </Link>
        </div>
        <Navegacao variante="lateral" />
      </aside>
      <div className="shell-conteudo">{children}</div>
      <Navegacao variante="inferior" />
    </div>
  );
}
