import type { PapelExtra, TipoItem } from "./tipos";

export const TIPOS_RENDA = [
  "EMPREGO",
  "BICO",
  "RENDIMENTO",
  "VALE_TRANSPORTE",
  "VALE_ALIMENTACAO",
] as const;

export type TipoRenda = (typeof TIPOS_RENDA)[number];

export const TITULARES_RENDA = ["EU", "CONJUGE"] as const;

export type TitularRenda = (typeof TITULARES_RENDA)[number];

export const ROTULOS_TIPO_RENDA: Record<TipoRenda, string> = {
  EMPREGO: "Entrada",
  BICO: "Bico",
  RENDIMENTO: "Rendimento das contas",
  VALE_TRANSPORTE: "Vale-transporte",
  VALE_ALIMENTACAO: "Vale-alimentação",
};

export const ROTULOS_TITULAR: Record<TitularRenda, string> = {
  EU: "Casa",
  CONJUGE: "Casa",
};

export const GRUPOS_RENDA = [
  {
    id: "entrada",
    rotulo: "Entradas",
    nota: "Empregos, bicos e qualquer dinheiro que entra.",
    tipos: ["EMPREGO", "BICO"] as const,
  },
  {
    id: "rendimento",
    rotulo: "Rendimentos das contas",
    nota: "Reinveste. Se o mês apertar, entra nas contas.",
    tipos: ["RENDIMENTO"] as const,
  },
  {
    id: "vale",
    rotulo: "Vales",
    nota: "VA só na feira. VT entra no caixa.",
    tipos: ["VALE_TRANSPORTE", "VALE_ALIMENTACAO"] as const,
  },
] as const;

export type FonteRendaEntrada = {
  nome: string;
  tipo: TipoRenda;
  titular: TitularRenda;
  ordem?: number;
};

export type MapeamentoRenda = {
  tipoItem: TipoItem;
  papel: PapelExtra | null;
};

export const isTipoRenda = (valor: unknown): valor is TipoRenda =>
  typeof valor === "string" && (TIPOS_RENDA as readonly string[]).includes(valor);

export const isTitularRenda = (valor: unknown): valor is TitularRenda =>
  typeof valor === "string" && (TITULARES_RENDA as readonly string[]).includes(valor);

export const papelDoRendimento = (nome: string): PapelExtra => {
  const n = nome.toLowerCase();
  if (n.includes("poupan")) return "PROVENTO_POUPANCA";
  return "PROVENTO_FUNDO";
};

export const mapearRendaParaItem = (tipo: TipoRenda, nome = ""): MapeamentoRenda => {
  if (tipo === "VALE_TRANSPORTE") return { tipoItem: "EXTRA", papel: "VALE_TRANSPORTE" };
  if (tipo === "VALE_ALIMENTACAO") return { tipoItem: "EXTRA", papel: "VALE_ALIMENTACAO" };
  if (tipo === "RENDIMENTO") return { tipoItem: "EXTRA", papel: papelDoRendimento(nome) };
  return { tipoItem: "SALDO", papel: null };
};

export const rendasPadrao = (): FonteRendaEntrada[] => [
  { nome: "Projeto", tipo: "EMPREGO", titular: "EU", ordem: 0 },
  { nome: "Pesquisa", tipo: "EMPREGO", titular: "EU", ordem: 1 },
  { nome: "HUJB", tipo: "EMPREGO", titular: "EU", ordem: 2 },
  { nome: "Bicos", tipo: "BICO", titular: "EU", ordem: 3 },
  { nome: "Vale-transporte", tipo: "VALE_TRANSPORTE", titular: "EU", ordem: 4 },
  { nome: "Vale-alimentação", tipo: "VALE_ALIMENTACAO", titular: "EU", ordem: 5 },
  { nome: "Rendimento das contas", tipo: "RENDIMENTO", titular: "EU", ordem: 6 },
  { nome: "Rendimento da poupança", tipo: "RENDIMENTO", titular: "EU", ordem: 7 },
];

export const agruparRendas = <T extends { tipo: TipoRenda }>(rendas: T[]) =>
  GRUPOS_RENDA.map((grupo) => ({
    ...grupo,
    itens: rendas.filter((renda) => (grupo.tipos as readonly TipoRenda[]).includes(renda.tipo)),
  }));

export const somarRendimentoPassivo = (extras: { papel?: PapelExtra | null; valor: number }[]) =>
  extras.reduce((acc, item) => {
    if (item.papel === "PROVENTO_FUNDO" || item.papel === "PROVENTO_POUPANCA") {
      return acc + (Number(item.valor) || 0);
    }
    return acc;
  }, 0);
