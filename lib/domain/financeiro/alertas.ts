import type { ParcelaCartao } from "./cartao";
import type { ResultadoMes } from "./tipos";

export type SeveridadeAlerta = "aviso" | "critico";

export type AlertaMes = {
  id: string;
  severidade: SeveridadeAlerta;
  mensagem: string;
  href?: string;
};

type EntradaAlertas = {
  competencia: string;
  resultado: ResultadoMes;
  parcelas?: ParcelaCartao[];
};

const acima = (real: number, sugestao: number) => real > sugestao + 0.005 && sugestao >= 0;

/** Alertas do mês: negativo, parcela acabando, acima da sugestão/teto. */
export const alertasDoMes = ({ competencia, resultado, parcelas = [] }: EntradaAlertas): AlertaMes[] => {
  const lista: AlertaMes[] = [];
  const mesQ = encodeURIComponent(competencia);
  const { resumo, despesasVariaveis: dv, investimentos, distribuicao } = resultado;

  if (resumo.sobrou < -0.005) {
    lista.push({
      id: "mes-negativo",
      severidade: "critico",
      mensagem: "Mês no vermelho: o que saiu passou do que entrou. Não sugerir depósito na meta.",
      href: `/contas?mes=${mesQ}`,
    });
  }

  for (const parcela of parcelas) {
    if (parcela.atual === parcela.total && parcela.total > 0) {
      lista.push({
        id: `parcela-fim-${parcela.nome}-${parcela.atual}`,
        severidade: "aviso",
        mensagem: `Última parcela de “${parcela.nome}” (${parcela.atual}/${parcela.total}).`,
        href: `/cartao?mes=${mesQ}`,
      });
    }
  }

  if (dv.cartao.estoura || acima(dv.cartao.fatura, dv.cartao.teto)) {
    lista.push({
      id: "cartao-teto",
      severidade: "critico",
      mensagem: "Fatura do cartão acima do teto (sobra após contas).",
      href: `/cartao?mes=${mesQ}`,
    });
  }

  if (acima(dv.feira.real, dv.feira.sugestao)) {
    lista.push({
      id: "feira-acima",
      severidade: "aviso",
      mensagem: "Feira acima da sugestão (vale-alimentação).",
      href: `/contas?mes=${mesQ}`,
    });
  }

  if (acima(dv.gasolina.real, dv.gasolina.sugestao)) {
    lista.push({
      id: "gasolina-acima",
      severidade: "aviso",
      mensagem: "Gasolina acima da sugestão (vale-transporte).",
      href: `/contas?mes=${mesQ}`,
    });
  }

  if (resumo.sobrou < -0.005 && (investimentos.poupanca.real > 0.005 || distribuicao.metaFinal > 0.005)) {
    lista.push({
      id: "deposito-com-negativo",
      severidade: "aviso",
      mensagem: "Há aporte marcado com o mês negativo — revise poupança e meta.",
      href: `/investimentos?mes=${mesQ}`,
    });
  }

  return lista;
};

/** Depósito sugerido na meta: zero se o mês ficou negativo. */
export const sugerirDepositoMeta = (resultado: ResultadoMes): number => {
  if (resultado.resumo.sobrou < -0.005) return 0;
  return resultado.distribuicao.metaFinal;
};
