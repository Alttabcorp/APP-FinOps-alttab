import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alttab FinOps · Contas da casa",
    short_name: "FinOps",
    description: "Contas da casa: o que entrou, o que pagou, o que sobrou para a meta.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#e8efec",
    theme_color: "#0b2a21",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ganhos do mês", url: "/ganhos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Gastos do mês", url: "/despesas", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Adicionar feira", url: "/despesas?add=feira", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Cartão", url: "/cartao", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
