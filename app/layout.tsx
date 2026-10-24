import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Contas da casa",
  description: "Dashboard da casa: entradas, contas, cartão, empresa e investimentos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen antialiased">
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
