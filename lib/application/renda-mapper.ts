import type { FonteRenda } from "@prisma/client";
import type { TipoRenda, TitularRenda } from "@/lib/domain/financeiro/renda";

export type FonteRendaDTO = {
  id: string;
  nome: string;
  tipo: TipoRenda;
  titular: TitularRenda;
  ordem: number;
};

export type FonteRendaPayload = {
  id?: string;
  nome: string;
  tipo: TipoRenda;
  titular?: TitularRenda;
};

export const fonteParaDto = (fonte: FonteRenda): FonteRendaDTO => ({
  id: fonte.id,
  nome: fonte.nome,
  tipo: fonte.tipo,
  titular: fonte.titular,
  ordem: fonte.ordem,
});
