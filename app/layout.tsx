import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree } from "next/font/google";
import { AtualizarAuto } from "@/components/atualizar-auto";
import { InstalarApp } from "@/components/instalar-app";
import { RegistrarSw } from "@/components/registrar-sw";
import { Shell } from "@/components/shell";
import "./globals.css";

const sans = Figtree({
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
  description: "Contas da casa: o que entrou, o que pagou, o que sobrou para a meta.",
  applicationName: "Alttab FinOps",
  appleWebApp: { capable: true, title: "FinOps", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b2a21",
  // No celular, o teclado encolhe a página em vez de cobrir o modal.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen antialiased">
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        <Shell>{children}</Shell>
        <RegistrarSw />
        <AtualizarAuto />
        <InstalarApp />
      </body>
    </html>
  );
}
