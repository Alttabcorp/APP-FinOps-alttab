import type { FinalidadeConta } from "./conta";
import type { ParSugestaoReal, ResultadoMes } from "./tipos";

const round2 = (valor: number) => Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;

const temValor = (valor: number) => round2(valor) > 0.005;

const texto = (valor: string | null | undefined) => (valor ?? "").trim();

const aporteDoMes = (par: Pick<ParSugestaoReal, "sugestao" | "real">) =>
  round2(temValor(par.real) ? par.real : par.sugestao);

export type ContaDestinoPix = {
  id: string;
  nome: string;
  finalidade: FinalidadeConta;
  banco?: string | null;
  titular?: string | null;
  chavePix?: string | null;
  recebePoupanca?: boolean;
};

export type AnualDestinoPix = {
  id: string;
  nome: string;
  valor: number;
  banco?: string | null;
  chavePix?: string | null;
};

export type DestinoCartaoPix = {
  nome: string;
  chavePix?: string | null;
};

export type DestinosTransferencia = {
  contas: ContaDestinoPix[];
  anuais: AnualDestinoPix[];
  destinoCartao: DestinoCartaoPix | null;
};

export type LinhaTransferencia = {
  id: string;
  rotulo: string;
  valor: number;
  destino: string;
  banco: string;
  titular: string;
  chavePix: string;
};

const contaPorFinalidade = (contas: ContaDestinoPix[], finalidade: FinalidadeConta) =>
  contas.find((conta) => conta.finalidade === finalidade) ?? null;

const contaDaPoupanca = (contas: ContaDestinoPix[]) =>
  contas.find((conta) => conta.recebePoupanca) ?? contaPorFinalidade(contas, "POUPANCA");

const linhaDaConta = (
  id: string,
  rotulo: string,
  valor: number,
  conta: ContaDestinoPix | null,
  fallback: string,
): LinhaTransferencia | null => {
  if (!temValor(valor)) return null;
  return {
    id,
    rotulo,
    valor: round2(valor),
    destino: conta?.nome?.trim() || fallback,
    banco: texto(conta?.banco),
    titular: texto(conta?.titular),
    chavePix: texto(conta?.chavePix),
  };
};

export const montarRoteiroTransferencia = (
  resultado: ResultadoMes,
  destinos: DestinosTransferencia,
): LinhaTransferencia[] => {
  const linhas: LinhaTransferencia[] = [];
  const cartaoNome = texto(destinos.destinoCartao?.nome) || "Cartão";
  const fatura = round2(resultado.despesasVariaveis.cartao.fatura);
  if (temValor(fatura)) {
    linhas.push({
      id: "cartao",
      rotulo: "Cartão",
      valor: fatura,
      destino: cartaoNome,
      banco: "",
      titular: "",
      chavePix: texto(destinos.destinoCartao?.chavePix),
    });
  }

  const poupanca = linhaDaConta(
    "poupanca",
    "Poupança",
    round2(resultado.investimentos.poupanca.real),
    contaDaPoupanca(destinos.contas),
    "Poupança",
  );
  if (poupanca) linhas.push(poupanca);

  const fundo = linhaDaConta(
    "fundo",
    "Fundo",
    aporteDoMes(resultado.investimentos.fundo),
    contaPorFinalidade(destinos.contas, "INVESTIMENTO"),
    "Investimento",
  );
  if (fundo) linhas.push(fundo);

  const alttab = linhaDaConta(
    "alttab",
    "Alttab",
    aporteDoMes(resultado.investimentos.alttab),
    contaPorFinalidade(destinos.contas, "EMPRESA"),
    "Empresa",
  );
  if (alttab) linhas.push(alttab);

  for (const anual of destinos.anuais) {
    if (!temValor(anual.valor)) continue;
    linhas.push({
      id: `anual:${anual.id}`,
      rotulo: anual.nome,
      valor: round2(anual.valor),
      destino: anual.nome,
      banco: texto(anual.banco),
      titular: "",
      chavePix: texto(anual.chavePix),
    });
  }

  const meta = linhaDaConta(
    "meta",
    "Meta",
    round2(resultado.distribuicao.metaFinal),
    contaPorFinalidade(destinos.contas, "META"),
    "Meta",
  );
  if (meta) linhas.push(meta);

  return linhas;
};

export const CAMPOS_DEPOSITO = ["poupanca", "fundo", "alttab", "meta"] as const;

export type CampoDeposito = (typeof CAMPOS_DEPOSITO)[number];

export const isCampoDeposito = (valor: unknown): valor is CampoDeposito =>
  typeof valor === "string" && (CAMPOS_DEPOSITO as readonly string[]).includes(valor);

export const linhasDepositoInvestimento = (linhas: LinhaTransferencia[]) =>
  linhas.filter((linha) => isCampoDeposito(linha.id));
