import Link from "next/link";
import { Navegacao } from "@/components/navegacao";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[13.5rem_1fr]">
      <aside className="spine w-full flex flex-col gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:sticky lg:top-0 lg:h-screen lg:px-5 lg:py-6">
        <div className="min-w-0">
          <Link href="/" className="block text-inherit no-underline">
            <p className="text-[0.7rem] tracking-wide text-white/45">Alttab FinOps</p>
            <p className="mt-1 text-[1.05rem] font-semibold leading-tight">Contas da casa</p>
          </Link>
        </div>
        <div className="lg:mt-8">
          <Navegacao />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
