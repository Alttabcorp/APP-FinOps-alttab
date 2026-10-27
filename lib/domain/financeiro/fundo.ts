export const FUNDO_APORTE = 50;
export const FUNDO_RENDIMENTO_ALVO = 100;

export type PlanoFundo = {
  aporte: number;
  reaplicado: number;
  proximo: number;
  atingiuAlvo: boolean;
  sugestao: number;
};

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

export function planejarFundo(input: {
  apertado: boolean;
  rendimentoFundo: number;
  reinvestidoFundo: number;
}): PlanoFundo {
  const aporte = input.apertado ? 0 : FUNDO_APORTE;
  const rendimento = Math.max(0, Number(input.rendimentoFundo) || 0);
  const reinvestido = Math.max(0, round2(Number(input.reinvestidoFundo) || 0));
  const atingiuAlvo = rendimento + 0.005 >= FUNDO_RENDIMENTO_ALVO;
  const reaplicado = atingiuAlvo ? round2(reinvestido * 0.5) : reinvestido;
  const proximo = atingiuAlvo ? round2(reinvestido - reaplicado) : 0;

  return {
    aporte,
    reaplicado,
    proximo,
    atingiuAlvo,
    sugestao: round2(aporte + reaplicado),
  };
}
