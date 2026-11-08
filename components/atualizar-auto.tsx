"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const INTERVALO_MS = 20_000;
const LIMITE_PUXAR = 70;

/** True quando o usuário está digitando ou com uma janela aberta: nesse caso não recarrega os dados. */
function ocupado() {
  const ativo = document.activeElement;
  const digitando =
    ativo instanceof HTMLInputElement || ativo instanceof HTMLTextAreaElement || ativo instanceof HTMLSelectElement;
  return digitando || document.querySelector("dialog[open]") !== null;
}

/**
 * Mantém os dados em dia:
 * - recarrega ao voltar para o app/aba, ao voltar a internet e a cada 20 s com a tela visível;
 * - no celular, puxar a tela para baixo no topo atualiza (como nos apps nativos).
 */
export function AtualizarAuto() {
  const router = useRouter();
  const [puxada, setPuxada] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const inicioY = useRef<number | null>(null);
  const puxadaRef = useRef(0);

  const atualizar = useCallback(
    (forcar = false) => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      if (!forcar && ocupado()) return;
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    const aoVoltar = () => atualizar();
    const aoVisivel = () => {
      if (document.visibilityState === "visible") atualizar();
    };
    const timer = window.setInterval(() => atualizar(), INTERVALO_MS);
    document.addEventListener("visibilitychange", aoVisivel);
    window.addEventListener("focus", aoVoltar);
    window.addEventListener("online", aoVoltar);
    window.addEventListener("pageshow", aoVoltar);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", aoVisivel);
      window.removeEventListener("focus", aoVoltar);
      window.removeEventListener("online", aoVoltar);
      window.removeEventListener("pageshow", aoVoltar);
    };
  }, [atualizar]);

  useEffect(() => {
    const aoComecar = (e: TouchEvent) => {
      const dentroDeJanela = (e.target as Element | null)?.closest("dialog");
      inicioY.current = window.scrollY <= 0 && !dentroDeJanela ? e.touches[0].clientY : null;
    };
    const aoMover = (e: TouchEvent) => {
      if (inicioY.current === null) return;
      const delta = e.touches[0].clientY - inicioY.current;
      if (delta <= 0 || window.scrollY > 0) {
        puxadaRef.current = 0;
        setPuxada(0);
        return;
      }
      puxadaRef.current = Math.min(delta * 0.5, LIMITE_PUXAR + 20);
      setPuxada(puxadaRef.current);
    };
    const aoSoltar = () => {
      const passou = puxadaRef.current >= LIMITE_PUXAR;
      inicioY.current = null;
      puxadaRef.current = 0;
      setPuxada(0);
      if (!passou) return;
      setAtualizando(true);
      router.refresh();
      window.setTimeout(() => setAtualizando(false), 900);
    };
    document.addEventListener("touchstart", aoComecar, { passive: true });
    document.addEventListener("touchmove", aoMover, { passive: true });
    document.addEventListener("touchend", aoSoltar);
    document.addEventListener("touchcancel", aoSoltar);
    return () => {
      document.removeEventListener("touchstart", aoComecar);
      document.removeEventListener("touchmove", aoMover);
      document.removeEventListener("touchend", aoSoltar);
      document.removeEventListener("touchcancel", aoSoltar);
    };
  }, [router]);

  if (puxada <= 0 && !atualizando) return null;
  const altura = atualizando ? LIMITE_PUXAR * 0.6 : puxada;
  const pronto = puxada >= LIMITE_PUXAR;

  return (
    <div className="ptr" style={{ transform: `translateY(${altura - 48}px)` }} role="status" aria-live="polite">
      <span className={`ptr-icone ${atualizando ? "is-girando" : ""}`} aria-hidden="true">
        {atualizando || pronto ? "↻" : "↓"}
      </span>
      <span className="sr-only">{atualizando ? "Atualizando" : "Puxe para atualizar"}</span>
    </div>
  );
}
