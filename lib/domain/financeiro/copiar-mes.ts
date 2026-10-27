import { TIPOS_ITEM, type PapelExtra, type TipoItem } from "./tipos";

export type ItemClonavel = {
  tipo: TipoItem;
  nome: string;
  valor: number;
  papel?: PapelExtra | null;
  ordem: number;
  pago: boolean;
  fonteRendaId?: string | null;
  contaAnualId?: string | null;
};

export const TIPOS_COPIA_PADRAO: TipoItem[] = ["SALDO", "EXTRA", "CONTA"];
// Abrir um mês novo usa este padrão: entradas e rendimento do mês anterior entram como previsão.

export const GRUPOS_COPIA: { tipo: TipoItem; rotulo: string; detalhe: string }[] = [
  { tipo: "SALDO", rotulo: "Saldo", detalhe: "Empregos, bicos e outras entradas em dinheiro." },
  { tipo: "EXTRA", rotulo: "Extra", detalhe: "Vale-transporte, vale-alimentação e rendimento. Rendimento reinveste, ou paga conta se apertar." },
  { tipo: "CONTA", rotulo: "Contas fixas", detalhe: "Valores das contas que se repetem." },
  { tipo: "EXTRA_MES", rotulo: "Extra do mês", detalhe: "Gás, ração, água mineral e o que não se repete." },
];

const nomeChave = (nome: string) => nome.toLowerCase().trim();

export const tiposCopiaValidos = (tipos: unknown): TipoItem[] => {
  if (!Array.isArray(tipos)) return [...TIPOS_COPIA_PADRAO];
  return TIPOS_ITEM.filter((tipo) => tipos.includes(tipo));
};

export const clonarItensParaNovoMes = (
  origem: ItemClonavel[],
  copiarValoresDe: TipoItem[] = ["CONTA"],
): ItemClonavel[] => {
  const tipos = new Set(copiarValoresDe);
  return origem
    .filter((item) => item.tipo !== "ANUAL")
    .map((item, ordem) => ({
      tipo: item.tipo,
      nome: item.nome,
      valor: tipos.has(item.tipo) ? Number(item.valor) || 0 : 0,
      papel: item.papel ?? null,
      ordem: item.ordem ?? ordem,
      pago: false,
      fonteRendaId: item.fonteRendaId ?? null,
      contaAnualId: null,
    }));
};

export const aplicarValoresDoMesAnterior = (
  destino: ItemClonavel[],
  origem: ItemClonavel[],
  copiarValoresDe: TipoItem[],
): ItemClonavel[] => {
  if (copiarValoresDe.length === 0) return destino.map((item, ordem) => ({ ...item, ordem }));

  const tipos = new Set(copiarValoresDe);
  const resultado: ItemClonavel[] = destino.filter((item) => !tipos.has(item.tipo));

  for (const tipo of TIPOS_ITEM) {
    if (!tipos.has(tipo)) continue;
    const doDestino = destino.filter((item) => item.tipo === tipo);
    const daOrigem = origem.filter((item) => item.tipo === tipo);
    const usados = new Set<number>();

    for (const atual of doDestino) {
      const idx = daOrigem.findIndex(
        (item, i) => !usados.has(i) && nomeChave(item.nome) === nomeChave(atual.nome),
      );
      if (idx >= 0) {
        usados.add(idx);
        const copiado = daOrigem[idx];
        resultado.push({
          ...atual,
          valor: Number(copiado.valor) || 0,
          papel: tipo === "EXTRA" ? (copiado.papel ?? atual.papel ?? null) : atual.papel,
          fonteRendaId: atual.fonteRendaId ?? copiado.fonteRendaId ?? null,
        });
      } else {
        resultado.push(atual);
      }
    }

    daOrigem.forEach((item, i) => {
      if (usados.has(i)) return;
      resultado.push({
        tipo: item.tipo,
        nome: item.nome,
        valor: Number(item.valor) || 0,
        papel: item.papel ?? null,
        ordem: resultado.length,
        pago: false,
        fonteRendaId: item.fonteRendaId ?? null,
      });
    });
  }

  return resultado.map((item, ordem) => ({ ...item, ordem }));
};
