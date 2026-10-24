const REGEX_COMPETENCIA = /^\d{4}-(0[1-9]|1[0-2])$/;

export const isCompetencia = (valor: string): boolean => REGEX_COMPETENCIA.test(valor);

export const competenciaAtual = (agora = new Date()): string => {
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}`;
};

export const indiceEntreCompetencias = (de: string, ate: string) => {
  const [anoDe, mesDe] = de.split("-").map(Number);
  const [anoAte, mesAte] = ate.split("-").map(Number);
  return (anoAte - anoDe) * 12 + (mesAte - mesDe);
};

export const avancarCompetencia = (competencia: string, delta = 1): string => {
  const [ano, mes] = competencia.split("-").map(Number);
  const data = new Date(ano, mes - 1 + delta, 1);
  return competenciaAtual(data);
};

export const formatarCompetencia = (competencia: string): string => {
  const [ano, mes] = competencia.split("-").map(Number);
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ano, mes - 1, 1));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const formatarCompetenciaCurta = (competencia: string): string => {
  const [ano, mes] = competencia.split("-");
  return `${mes}/${ano.slice(2)}`;
};

export const formatarNomeMes = (competencia: string): string => {
  const [ano, mes] = competencia.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(ano, mes - 1, 1));
};

export const opcoesCompetencia = (centro = competenciaAtual(), atras = 12, frente = 18) => {
  const lista: { valor: string; rotulo: string }[] = [];
  for (let i = -atras; i <= frente; i += 1) {
    const valor = avancarCompetencia(centro, i);
    lista.push({ valor, rotulo: formatarCompetencia(valor) });
  }
  return lista;
};
