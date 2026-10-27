"use client";

import { useEffect, useState, useTransition } from "react";
import { marcarDepositoAction } from "@/app/actions/mes";
import type { CampoDeposito, LinhaTransferencia } from "@/lib/domain/financeiro/transferencia";
import { formatarMoeda } from "@/lib/formatacao";

type Marcas = Record<CampoDeposito, boolean>;

type Props = {
  competencia: string;
  fechado: boolean;
  linhas: LinhaTransferencia[];
  marcas: Marcas;
};

export function ChecklistDepositos({ competencia, fechado, linhas, marcas }: Props) {
  const [estado, setEstado] = useState(marcas);
  const [copiada, setCopiada] = useState("");
  const [pendente, startTransition] = useTransition();

  useEffect(() => {
    setEstado(marcas);
  }, [marcas]);

  const feitos = linhas.filter((linha) => estado[linha.id as CampoDeposito]).length;
  const falta = linhas.length - feitos;

  const marcar = (campo: CampoDeposito, depositado: boolean) => {
    setEstado((atual) => ({ ...atual, [campo]: depositado }));
    startTransition(async () => {
      const resposta = await marcarDepositoAction(competencia, campo, depositado);
      if (!resposta.ok) {
        setEstado((atual) => ({ ...atual, [campo]: !depositado }));
      }
    });
  };

  const copiar = async (linha: LinhaTransferencia) => {
    if (!linha.chavePix) return;
    try {
      await navigator.clipboard.writeText(linha.chavePix);
      setCopiada(linha.id);
      window.setTimeout(() => setCopiada((atual) => (atual === linha.id ? "" : atual)), 1600);
    } catch {
      setCopiada("");
    }
  };

  if (linhas.length === 0) {
    return (
      <section className="mt-8" aria-labelledby="depositos-titulo">
        <h2 id="depositos-titulo" className="titulo-secao">
          Depósitos deste mês
        </h2>
        <p className="mt-2 text-sm text-mute">Nada para depositar neste mês.</p>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="depositos-titulo">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="depositos-titulo" className="titulo-secao">
          Depósitos deste mês
        </h2>
        <p className="text-sm text-mute">
          {falta === 0
            ? "Tudo depositado."
            : `${feitos} de ${linhas.length} ${linhas.length === 1 ? "feito" : "feitos"}`}
        </p>
      </header>
      <p className="mt-1 max-w-[46ch] text-sm text-mute">
        Marquem depois do PIX. Não altera o saldo da conta.
        {fechado ? " Mês fechado." : null}
      </p>
      <ul className="roteiro mt-3">
        {linhas.map((linha) => {
          const campo = linha.id as CampoDeposito;
          const feito = Boolean(estado[campo]);
          const id = `deposito-${campo}`;
          return (
            <li key={linha.id}>
              <label
                htmlFor={id}
                className={`flex min-w-0 flex-1 items-center gap-3 ${fechado ? "" : "cursor-pointer"}`}
              >
                <input
                  id={id}
                  className="checkbox-pago shrink-0"
                  type="checkbox"
                  checked={feito}
                  disabled={fechado || pendente}
                  onChange={(evento) => marcar(campo, evento.target.checked)}
                />
                <span className="min-w-0">
                  <span className={`block text-sm ${feito ? "text-mute line-through" : ""}`}>
                    {linha.rotulo}
                    {linha.destino && linha.destino !== linha.rotulo ? ` · ${linha.destino}` : ""}
                  </span>
                  <span className={`money text-base ${feito ? "text-mute" : ""}`}>
                    {formatarMoeda(linha.valor)}
                  </span>
                </span>
              </label>
              {linha.chavePix ? (
                <button
                  className="btn shrink-0 text-sm"
                  type="button"
                  disabled={fechado}
                  onClick={() => copiar(linha)}
                >
                  {copiada === linha.id ? "Copiada" : "Copiar chave"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
