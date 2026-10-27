import type { CompraCartao, RecorrenteCartao } from "@prisma/client";

export type CompraCartaoDTO = {
  id: string;
  nome: string;
  valorTotal: number;
  parcelas: number;
  valorParcela: number;
  competenciaInicio: string;
  ordem: number;
};

export type CompraCartaoPayload = {
  id?: string;
  nome: string;
  valorTotal: number;
  parcelas: number;
  competenciaInicio: string;
};

export type RecorrenteCartaoDTO = {
  id: string;
  nome: string;
  valor: number;
  ordem: number;
};

export type RecorrenteCartaoPayload = {
  id?: string;
  nome: string;
  valor: number;
};

export const compraParaDto = (compra: CompraCartao): CompraCartaoDTO => ({
  id: compra.id,
  nome: compra.nome,
  valorTotal: Number(compra.valorTotal),
  parcelas: compra.parcelas,
  valorParcela: Number(compra.valorParcela),
  competenciaInicio: compra.competenciaInicio,
  ordem: compra.ordem,
});

export const recorrenteParaDto = (recorrente: RecorrenteCartao): RecorrenteCartaoDTO => ({
  id: recorrente.id,
  nome: recorrente.nome,
  valor: Number(recorrente.valor),
  ordem: recorrente.ordem,
});
