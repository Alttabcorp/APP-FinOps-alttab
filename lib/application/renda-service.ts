import type { FonteRenda, ItemFinanceiro, MesFinanceiro } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { fonteParaDto, type FonteRendaDTO, type FonteRendaPayload } from "@/lib/application/renda-mapper";
import {
  isTipoRenda,
  isTitularRenda,
  mapearRendaParaItem,
  rendasPadrao,
} from "@/lib/domain/financeiro/renda";

type MesComItens = MesFinanceiro & { itens: ItemFinanceiro[] };

const LIMITE_NOME = 80;
const LIMITE_DESTINO = 80;
const LIMITE_CHAVE = 120;
const ID_PREFERENCIA = "casa";

const textoLivre = (valor: unknown, limite: number, rotulo: string) => {
  const texto = String(valor ?? "").trim();
  if (texto.length > limite) throw new Error(`${rotulo} é longo demais.`);
  return texto;
};

const preferenciaParaDto = (atual: {
  metaRendimentoPassivo: { toString(): string } | number | null;
  gastoPessoalMes: { toString(): string } | number | null;
  destinoCartaoNome: string;
  destinoCartaoChave: string;
}) => ({
  metaRendimentoPassivo: atual.metaRendimentoPassivo == null ? null : Number(atual.metaRendimentoPassivo),
  gastoPessoalMes: atual.gastoPessoalMes == null ? null : Number(atual.gastoPessoalMes),
  destinoCartaoNome: atual.destinoCartaoNome ?? "",
  destinoCartaoChave: atual.destinoCartaoChave ?? "",
});

const nomeChave = (nome: string) => nome.toLowerCase().trim();

const validarPayload = (payload: FonteRendaPayload) => {
  const nome = payload.nome.trim();
  if (!nome) throw new Error("Informe o nome da renda.");
  if (nome.length > LIMITE_NOME) throw new Error("O nome da renda é longo demais.");
  if (!isTipoRenda(payload.tipo)) throw new Error("Escolha o tipo da renda.");
  const titular = isTitularRenda(payload.titular) ? payload.titular : "EU";
  return { nome, tipo: payload.tipo, titular };
};

export const garantirRendasPadrao = async () => {
  const total = await prisma.fonteRenda.count();
  if (total === 0) {
    await prisma.fonteRenda.createMany({
      data: rendasPadrao().map((renda) => ({
        nome: renda.nome,
        tipo: renda.tipo,
        titular: renda.titular,
        ordem: renda.ordem ?? 0,
        atualizadoEm: new Date(),
      })),
    });
    const fontes = await prisma.fonteRenda.findMany({ orderBy: { ordem: "asc" } });
    for (const fonte of fontes) {
      await adicionarFonteAosMesesAbertos(fonte);
    }
    return;
  }

  await garantirFonteRendimento("Rendimento da poupança", "poupan");
  await garantirFonteRendimento("Rendimento da meta", "meta");
};

const garantirFonteRendimento = async (nome: string, trecho: string) => {
  const existentes = await prisma.fonteRenda.findMany({
    where: {
      tipo: "RENDIMENTO",
      OR: [
        { nome: { equals: nome, mode: "insensitive" } },
        { nome: { contains: trecho, mode: "insensitive" } },
      ],
    },
    orderBy: { criadoEm: "asc" },
  });
  const [fonte, ...duplicadas] = existentes;
  if (fonte) {
    for (const extra of duplicadas) {
      await prisma.fonteRenda.delete({ where: { id: extra.id } });
    }
    await deduplicarItensDoRendimento(fonte);
    return;
  }

  const ultima = await prisma.fonteRenda.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const criada = await prisma.fonteRenda.create({
    data: {
      nome,
      tipo: "RENDIMENTO",
      titular: "EU",
      ordem: (ultima?.ordem ?? -1) + 1,
    },
  });
  await adicionarFonteAosMesesAbertos(criada);
};

const deduplicarItensDoRendimento = async (fonte: FonteRenda) => {
  const mapeado = mapearRendaParaItem(fonte.tipo, fonte.nome);
  const meses = await prisma.mesFinanceiro.findMany({
    where: { fechado: false },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
  for (const mes of meses) {
    const iguais = mes.itens.filter(
      (item) => item.tipo === "EXTRA" && nomeChave(item.nome) === nomeChave(fonte.nome),
    );
    const [ficar, ...resto] = iguais;
    if (ficar && (ficar.fonteRendaId !== fonte.id || ficar.papel !== mapeado.papel)) {
      await prisma.itemFinanceiro.update({
        where: { id: ficar.id },
        data: { fonteRendaId: fonte.id, papel: mapeado.papel },
      });
    }
    for (const extra of resto) {
      await prisma.itemFinanceiro.delete({ where: { id: extra.id } });
    }
  }
};

export const listarRendas = async (): Promise<FonteRendaDTO[]> => {
  await garantirRendasPadrao();
  const fontes = await prisma.fonteRenda.findMany({
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });
  return fontes.map(fonteParaDto);
};

export const salvarRenda = async (payload: FonteRendaPayload): Promise<FonteRendaDTO> => {
  const dados = validarPayload(payload);

  if (payload.id) {
    const existente = await prisma.fonteRenda.findUnique({ where: { id: payload.id } });
    if (!existente) throw new Error("Renda não encontrada.");
    const atualizada = await prisma.fonteRenda.update({
      where: { id: payload.id },
      data: dados,
    });
    if (atualizada.nome !== existente.nome || atualizada.tipo !== existente.tipo) {
      const mapeado = mapearRendaParaItem(atualizada.tipo, atualizada.nome);
      await prisma.itemFinanceiro.updateMany({
        where: { fonteRendaId: atualizada.id, mes: { fechado: false } },
        data: {
          nome: atualizada.nome,
          tipo: mapeado.tipoItem,
          papel: mapeado.papel,
        },
      });
    }
    return fonteParaDto(atualizada);
  }

  const ultima = await prisma.fonteRenda.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const criada = await prisma.fonteRenda.create({
    data: { ...dados, ordem: (ultima?.ordem ?? -1) + 1 },
  });
  await adicionarFonteAosMesesAbertos(criada);
  return fonteParaDto(criada);
};

export const excluirRenda = async (id: string) => {
  const existente = await prisma.fonteRenda.findUnique({ where: { id } });
  if (!existente) throw new Error("Renda não encontrada.");
  await prisma.fonteRenda.delete({ where: { id } });
};

export const obterPreferenciaCasa = async () => {
  const atual = await prisma.preferenciaCasa.upsert({
    where: { id: ID_PREFERENCIA },
    create: { id: ID_PREFERENCIA, atualizadoEm: new Date() },
    update: {},
  });
  return preferenciaParaDto(atual);
};

export const salvarGastoPessoalMes = async (valor: number | null) => {
  const n = Number(valor);
  const gasto = Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
  const atual = await prisma.preferenciaCasa.upsert({
    where: { id: ID_PREFERENCIA },
    create: { id: ID_PREFERENCIA, gastoPessoalMes: gasto, atualizadoEm: new Date() },
    update: { gastoPessoalMes: gasto },
  });
  return preferenciaParaDto(atual);
};

export const salvarMetaRendimentoPassivo = async (valor: number | null) => {
  const n = Number(valor);
  const meta = Number.isFinite(n) && n > 0 ? n : null;
  const atual = await prisma.preferenciaCasa.upsert({
    where: { id: ID_PREFERENCIA },
    create: { id: ID_PREFERENCIA, metaRendimentoPassivo: meta, atualizadoEm: new Date() },
    update: { metaRendimentoPassivo: meta },
  });
  return preferenciaParaDto(atual);
};

export const salvarDestinoCartao = async (nome: string, chavePix: string) => {
  const destinoCartaoNome = textoLivre(nome, LIMITE_DESTINO, "O destino do cartão");
  const destinoCartaoChave = textoLivre(chavePix, LIMITE_CHAVE, "A chave PIX");
  const atual = await prisma.preferenciaCasa.upsert({
    where: { id: ID_PREFERENCIA },
    create: { id: ID_PREFERENCIA, destinoCartaoNome, destinoCartaoChave, atualizadoEm: new Date() },
    update: { destinoCartaoNome, destinoCartaoChave },
  });
  return preferenciaParaDto(atual);
};

const itemCompativelComFonte = (
  linha: ItemFinanceiro,
  fonte: FonteRenda,
  usados: Set<string>,
) => {
  if (usados.has(linha.id) || linha.fonteRendaId) return false;
  const mapeado = mapearRendaParaItem(fonte.tipo, fonte.nome);
  return (
    linha.tipo === mapeado.tipoItem &&
    (nomeChave(linha.nome) === nomeChave(fonte.nome) ||
      (mapeado.papel != null && linha.papel === mapeado.papel))
  );
};

const aplicarFonteNoMes = async (
  mes: MesComItens,
  fonte: FonteRenda,
  usados: Set<string>,
  incluirNovas: boolean,
) => {
  const mapeado = mapearRendaParaItem(fonte.tipo, fonte.nome);
  let item = mes.itens.find((linha) => linha.fonteRendaId === fonte.id);
  if (!item) {
    item = mes.itens.find((linha) => itemCompativelComFonte(linha, fonte, usados));
  }
  if (item) {
    usados.add(item.id);
    if (item.fonteRendaId !== fonte.id || item.papel !== mapeado.papel) {
      const atualizado = await prisma.itemFinanceiro.update({
        where: { id: item.id },
        data: { fonteRendaId: fonte.id, papel: mapeado.papel },
      });
      mes.itens = mes.itens.map((linha) => (linha.id === atualizado.id ? atualizado : linha));
    }
    return;
  }
  if (!incluirNovas) return;
  const criado = await prisma.itemFinanceiro.create({
    data: {
      mesId: mes.id,
      tipo: mapeado.tipoItem,
      nome: fonte.nome,
      valor: 0,
      papel: mapeado.papel,
      ordem: mes.itens.length,
      fonteRendaId: fonte.id,
    },
  });
  mes.itens.push(criado);
  usados.add(criado.id);
};

const adicionarFonteAosMesesAbertos = async (fonte: FonteRenda) => {
  const meses = await prisma.mesFinanceiro.findMany({
    where: { fechado: false },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
  for (const mes of meses) {
    await aplicarFonteNoMes(mes, fonte, new Set(), true);
  }
};

export const sincronizarRendasDoMes = async (
  mesId: string,
  opcoes: { incluirNovas?: boolean } = {},
) => {
  const mes = await prisma.mesFinanceiro.findUnique({
    where: { id: mesId },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
  if (!mes || mes.fechado) return mes;

  await garantirRendasPadrao();
  const fontes = await prisma.fonteRenda.findMany({ orderBy: { ordem: "asc" } });
  const usados = new Set<string>();
  const incluirNovas = opcoes.incluirNovas ?? false;

  for (const fonte of fontes) {
    await aplicarFonteNoMes(mes, fonte, usados, incluirNovas);
  }

  return prisma.mesFinanceiro.findUnique({
    where: { id: mesId },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
};
