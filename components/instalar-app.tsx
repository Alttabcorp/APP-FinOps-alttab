"use client";

import { useEffect, useState } from "react";

type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CHAVE = "instalar-app-dispensado";
const DIAS_SILENCIO = 14;

function jaInstalado() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function dispensadoRecentemente() {
  try {
    const quando = Number(localStorage.getItem(CHAVE));
    return quando > 0 && Date.now() - quando < DIAS_SILENCIO * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * Convida a instalar o app. No Chrome/Edge/Android usa o prompt nativo;
 * no iPhone (Safari) mostra o passo a passo. Some se já instalado ou dispensado.
 */
export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [ios, setIos] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (jaInstalado() || dispensadoRecentemente()) return;

    const ehIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (ehIos) {
      setIos(true);
      setVisivel(true);
    }

    const aoPerguntar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacao);
      setVisivel(true);
    };
    const aoInstalar = () => setVisivel(false);

    // Se o navegador não oferecer a instalação sozinho, mostra o passo manual (só em celular).
    const celular = /android|mobi/i.test(navigator.userAgent);
    const espera = window.setTimeout(() => {
      if (celular && !ehIos) {
        setManual(true);
        setVisivel(true);
      }
    }, 4000);

    window.addEventListener("beforeinstallprompt", aoPerguntar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.clearTimeout(espera);
      window.removeEventListener("beforeinstallprompt", aoPerguntar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  function dispensar() {
    try {
      localStorage.setItem(CHAVE, String(Date.now()));
    } catch {
      /* ignora */
    }
    setVisivel(false);
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice.catch(() => undefined);
    setEvento(null);
    setVisivel(false);
  }

  if (!visivel || (!evento && !ios && !manual)) return null;

  return (
    <aside className="instalar-app" role="dialog" aria-label="Instalar o aplicativo">
      <p>
        <strong>Instale o Alttab FinOps</strong>
        {ios
          ? "Toque em Compartilhar e depois em “Adicionar à Tela de Início” para abrir como app."
          : manual && !evento
            ? "Abra o menu do navegador (⋮) e toque em “Instalar app” ou “Adicionar à tela inicial”."
            : "Tenha o app na tela inicial, em tela cheia e com acesso rápido."}
      </p>
      <div className="instalar-app-acoes">
        {evento ? (
          <button type="button" className="btn-primary text-sm" onClick={() => void instalar()}>
            Instalar
          </button>
        ) : null}
        <button type="button" className="btn text-sm" onClick={dispensar}>
          Agora não
        </button>
      </div>
    </aside>
  );
}
