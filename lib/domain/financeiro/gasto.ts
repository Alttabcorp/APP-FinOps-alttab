import { formatarMoeda } from "@/lib/formatacao";

export const CATEGORIAS_GASTO = [
  "feira",
  "combustivel",
  "cartao",
  "energia",
  "agua",
  "agua_mineral",
  "racao",
  "internet",
  "celular",
  "gas",
  "anual",
  "outros",
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export const ROTULOS_CATEGORIA_GASTO: Record<CategoriaGasto, string> = {
  feira: "Feira",
  combustivel: "Combustível",
  cartao: "Cartão",
  energia: "Energia",
  agua: "Água",
  agua_mineral: "Água mineral",
  racao: "Ração",
  internet: "Internet",
  celular: "Celular",
  gas: "Gás",
  anual: "Contas anuais",
  outros: "Outros",
};

export const CATEGORIAS_PERGUNTA: CategoriaGasto[] = [
  "feira",
  "combustivel",
  "racao",
  "cartao",
  "agua_mineral",
  "energia",
  "agua",
];

export type ItemGasto = {
  tipo: string;
  nome: string;
  valor: number;
};

export type DetalheGasto = {
  nome: string;
  valor: number;
};

export type LinhaGasto = {
  categoria: CategoriaGasto;
  rotulo: string;
  valor: number;
  percentual: number;
  detalhes: DetalheGasto[];
};

export type PistaEconomia = {
  id: string;
  texto: string;
};

export type AnaliseGastos = {
  total: number;
  maior: LinhaGasto | null;
  ranking: LinhaGasto[];
  perguntas: LinhaGasto[];
  pistas: PistaEconomia[];
};

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

const numero = (valor: number | null | undefined) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export const normalizarNomeGasto = (nome: string) =>
  nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const classificarNomeGasto = (nome: string): CategoriaGasto => {
  const n = normalizarNomeGasto(nome);
  if (!n) return "outros";
  if (n.includes("agua") && n.includes("mineral")) return "agua_mineral";
  if (n.includes("racao") || n.includes("pet")) return "racao";
  if (n.includes("energia") || n.includes("luz") || n.includes("eletr")) return "energia";
  if (n.includes("agua") || n.includes("saneamento")) return "agua";
  if (n.includes("internet") || n.includes("wifi")) return "internet";
  if (n.includes("celular") || n.includes("telefone")) return "celular";
  if (n.includes("gasolina") || n.includes("combust")) return "combustivel";
  if (/(^| )gas($| )/.test(n) || n === "gas") return "gas";
  if (n.includes("feira") || n.includes("mercado")) return "feira";
  if (n.includes("cartao")) return "cartao";
  return "outros";
};

const somarDetalhes = (detalhes: DetalheGasto[]) =>
  round2(detalhes.reduce((acc, item) => acc + numero(item.valor), 0));

const TIPOS_GASTO = new Set(["CONTA", "EXTRA_MES", "ANUAL"]);

export type EntradaGastosMes = {
  itens: ItemGasto[];
  feira: number;
  gasolina: number;
  cartaoAvulso: number;
  faturaCartao: number;
  parcelasCartao?: DetalheGasto[];
};

export const agruparGastosDoMes = (entrada: EntradaGastosMes) => {
  const porCategoria = new Map<CategoriaGasto, DetalheGasto[]>();
  const adicionar = (categoria: CategoriaGasto, nome: string, valor: number) => {
    const quantia = round2(numero(valor));
    if (Math.abs(quantia) < 0.005) return;
    const lista = porCategoria.get(categoria) ?? [];
    lista.push({ nome, valor: quantia });
    porCategoria.set(categoria, lista);
  };

  adicionar("feira", "Feira", entrada.feira);
  adicionar("combustivel", "Combustível", entrada.gasolina);

  const avulso = numero(entrada.cartaoAvulso);
  const fatura = numero(entrada.faturaCartao);
  if (entrada.parcelasCartao?.length) {
    entrada.parcelasCartao.forEach((parcela) => adicionar("cartao", parcela.nome, parcela.valor));
  } else if (fatura > 0.005) {
    adicionar("cartao", "Fatura parcelada", fatura);
  }
  adicionar("cartao", "Avulso no cartão", avulso);

  entrada.itens.forEach((item) => {
    if (!TIPOS_GASTO.has(item.tipo)) return;
    const categoria = item.tipo === "ANUAL" ? "anual" : classificarNomeGasto(item.nome);
    adicionar(categoria, item.nome, item.valor);
  });

  const linhas = new Map<CategoriaGasto, { valor: number; detalhes: DetalheGasto[] }>();
  CATEGORIAS_GASTO.forEach((categoria) => {
    const detalhes = porCategoria.get(categoria) ?? [];
    linhas.set(categoria, { valor: somarDetalhes(detalhes), detalhes });
  });
  return linhas;
};

const paraLinha = (
  categoria: CategoriaGasto,
  grupo: { valor: number; detalhes: DetalheGasto[] },
  total: number,
): LinhaGasto => ({
  categoria,
  rotulo: ROTULOS_CATEGORIA_GASTO[categoria],
  valor: grupo.valor,
  percentual: total > 0.005 ? (grupo.valor / total) * 100 : 0,
  detalhes: grupo.detalhes,
});

export const analisarGastos = (
  atual: EntradaGastosMes,
  anterior?: EntradaGastosMes | null,
  sugestoes?: { feira?: number; gasolina?: number } | null,
): AnaliseGastos => {
  const grupos = agruparGastosDoMes(atual);
  const total = round2([...grupos.values()].reduce((acc, grupo) => acc + grupo.valor, 0));
  const todas = CATEGORIAS_GASTO.map((categoria) => paraLinha(categoria, grupos.get(categoria) ?? { valor: 0, detalhes: [] }, total));
  const ranking = [...todas].filter((linha) => linha.valor > 0.005).sort((a, b) => b.valor - a.valor);
  const perguntas = CATEGORIAS_PERGUNTA.map((categoria) => todas.find((linha) => linha.categoria === categoria)!);
  const maior = ranking[0] ?? null;
  const gruposAnterior = anterior ? agruparGastosDoMes(anterior) : null;

  const pistas: PistaEconomia[] = [];
  if (maior) {
    pistas.push({
      id: "maior",
      texto: `O maior gasto neste mês foi ${maior.rotulo.toLowerCase()}: ${formatarMoeda(maior.valor)}.`,
    });
  }

  const feira = grupos.get("feira")?.valor ?? 0;
  const gasolina = grupos.get("combustivel")?.valor ?? 0;
  const sugestaoFeira = numero(sugestoes?.feira);
  const sugestaoGasolina = numero(sugestoes?.gasolina);

  if (sugestaoFeira > 0.005 && feira > sugestaoFeira + 0.005) {
    pistas.push({
      id: "feira-va",
      texto: `A feira passou do vale-alimentação em ${formatarMoeda(feira - sugestaoFeira)}.`,
    });
  }
  if (sugestaoGasolina > 0.005 && gasolina > sugestaoGasolina + 0.005) {
    pistas.push({
      id: "gasolina-vt",
      texto: `O combustível passou do vale-transporte em ${formatarMoeda(gasolina - sugestaoGasolina)}.`,
    });
  }

  if (gruposAnterior) {
    const subiram = CATEGORIAS_PERGUNTA.map((categoria) => {
      const agora = grupos.get(categoria)?.valor ?? 0;
      const antes = gruposAnterior.get(categoria)?.valor ?? 0;
      return { categoria, delta: agora - antes, agora, antes };
    })
      .filter((linha) => linha.delta > 0.005 && linha.agora > 0.005)
      .sort((a, b) => b.delta - a.delta);
    subiram.slice(0, 3).forEach((linha) => {
      pistas.push({
        id: `subiu-${linha.categoria}`,
        texto: `${ROTULOS_CATEGORIA_GASTO[linha.categoria]} subiu ${formatarMoeda(linha.delta)} na comparação com o mês anterior.`,
      });
    });
  }

  CATEGORIAS_PERGUNTA.forEach((categoria) => {
    const valor = grupos.get(categoria)?.valor ?? 0;
    if (valor > 0.005) return;
    if (pistas.length >= 6) return;
    pistas.push({
      id: `falta-${categoria}`,
      texto: `${ROTULOS_CATEGORIA_GASTO[categoria]} ainda não tem valor neste mês.`,
    });
  });

  return { total, maior, ranking, perguntas, pistas };
};
