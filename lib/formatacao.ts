export const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(valor) ? valor : 0);

export const formatarVariacao = (valor: number) => {
  const n = Number.isFinite(valor) ? valor : 0;
  const prefixo = n > 0 ? "+" : "";
  return `${prefixo}${formatarMoeda(n)}`;
};

export const formatarDeltaMes = (atual: number, anterior: number, nomeMes: string) => {
  const delta = (Number.isFinite(atual) ? atual : 0) - (Number.isFinite(anterior) ? anterior : 0);
  if (Math.abs(delta) < 0.005) return `igual a ${nomeMes}`;
  if (delta > 0) return `${formatarMoeda(delta)} a mais que ${nomeMes}`;
  return `${formatarMoeda(Math.abs(delta))} a menos que ${nomeMes}`;
};

export const formatarPercentual = (valor: number) => {
  const n = Number.isFinite(valor) ? valor : 0;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n)}%`;
};

export const paraNumero = (valor: string | number | null | undefined) => {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (!valor) return 0;
  const normalizado = String(valor).replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(normalizado);
  return Number.isFinite(n) ? n : 0;
};
