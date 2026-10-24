import type { ItemFinanceiro, PapelExtra, TipoItem } from "./tipos";

export type ItemPadrao = ItemFinanceiro & {
  tipo: TipoItem;
  papel?: PapelExtra | null;
};

export const itensPadrao = (): ItemPadrao[] => [
  { tipo: "SALDO", nome: "Projeto", valor: 0 },
  { tipo: "SALDO", nome: "Pesquisa", valor: 0 },
  { tipo: "SALDO", nome: "HUJB", valor: 0 },
  { tipo: "EXTRA", nome: "Vale-transporte", valor: 0, papel: "VALE_TRANSPORTE" },
  { tipo: "EXTRA", nome: "Vale-alimentação", valor: 0, papel: "VALE_ALIMENTACAO" },
  { tipo: "EXTRA", nome: "Provento fundo", valor: 0, papel: "PROVENTO_FUNDO" },
  { tipo: "EXTRA", nome: "Rendimento da poupança", valor: 0, papel: "PROVENTO_POUPANCA" },
  { tipo: "CONTA", nome: "Crédito celular", valor: 0 },
  { tipo: "CONTA", nome: "Internet", valor: 0 },
  { tipo: "CONTA", nome: "Energia", valor: 0 },
  { tipo: "CONTA", nome: "Água", valor: 0 },
  { tipo: "EXTRA_MES", nome: "Gás", valor: 0 },
  { tipo: "EXTRA_MES", nome: "Ração", valor: 0 },
  { tipo: "EXTRA_MES", nome: "Água mineral", valor: 0 },
];
