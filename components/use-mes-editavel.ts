"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { definirMesFechadoAction, salvarMesAction, trazerValoresMesAnteriorAction } from "@/app/actions/mes";
import type { ItemDTO, MesDTO } from "@/lib/application/mes-mapper";
import { calcularMes } from "@/lib/domain/financeiro/calcular-mes";
import type { TipoItem } from "@/lib/domain/financeiro/tipos";

const porTipo = (itens: ItemDTO[], tipo: TipoItem) => itens.filter((item) => item.tipo === tipo);

const calcular = (
  origem: MesDTO,
  faturaCartao: number,
  gastoPessoalMes: number | null,
  reposicaoMeta: number,
  cartaoFixo: number,
) =>
  calcularMes({
    saldo: porTipo(origem.itens, "SALDO"),
    extra: porTipo(origem.itens, "EXTRA"),
    contas: porTipo(origem.itens, "CONTA"),
    extraMes: porTipo(origem.itens, "EXTRA_MES"),
    anuais: porTipo(origem.itens, "ANUAL"),
    despesasVariaveis: {
      feira: origem.feiraReal,
      cartao: origem.cartaoReal,
      gasolina: origem.gasolinaReal,
    },
    investimentos: {
      fundo: origem.fundoReal,
      alttab: origem.alttabReal,
      poupanca: origem.poupancaReal,
      poupancaEditado: origem.poupancaEditado,
    },
    gastoPessoalAlvo: gastoPessoalMes,
    reposicaoMeta,
    cartaoParcelas: faturaCartao,
    cartaoFixo,
  });

type Args = {
  mesInicial: MesDTO;
  faturaCartao?: number;
  gastoPessoalMes?: number | null;
  reposicaoMeta?: number;
  cartaoFixo?: number;
};

export function useMesEditavel({
  mesInicial,
  faturaCartao = 0,
  gastoPessoalMes = null,
  reposicaoMeta = 0,
  cartaoFixo = 0,
}: Args) {
  const [mes, setMes] = useState(mesInicial);
  const [status, setStatus] = useState("");
  const [pendente, startTransition] = useTransition();
  const [sujo, setSujo] = useState(false);
  const timer = useRef<number | null>(null);
  const editando = useRef(false);
  editando.current = sujo || pendente;

  useEffect(() => {
    if (editando.current) return;
    setMes(mesInicial);
  }, [mesInicial]);

  const totais = useMemo(
    () => calcular(mes, faturaCartao, gastoPessoalMes, reposicaoMeta, cartaoFixo),
    [mes, faturaCartao, gastoPessoalMes, reposicaoMeta, cartaoFixo],
  );

  const comPoupancaAutomatica = (origem: MesDTO): MesDTO => {
    if (origem.poupancaEditado) return origem;
    const calculado = calcular(origem, 0, gastoPessoalMes, reposicaoMeta, cartaoFixo);
    return { ...origem, poupancaReal: calculado.investimentos.poupanca.sugestao };
  };

  const salvar = (proximo = mes) => {
    if (proximo.fechado) return;
    startTransition(async () => {
      setStatus("Salvando…");
      const resposta = await salvarMesAction(comPoupancaAutomatica(proximo));
      if (resposta.ok) {
        setMes(resposta.mes);
        setSujo(false);
        setStatus("Salvo.");
      } else setStatus(resposta.erro);
    });
  };

  const agendarSalvar = (proximo: MesDTO) => {
    if (mes.fechado) return;
    setMes(proximo);
    setSujo(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => salvar(proximo), 600);
  };

  const atualizarItens = (tipo: TipoItem, itens: ItemDTO[]) => {
    const demais = mes.itens.filter((item) => item.tipo !== tipo);
    agendarSalvar({ ...mes, itens: [...demais, ...itens] });
  };

  const marcarPago = (indice: number, pago: boolean) => {
    agendarSalvar({
      ...mes,
      itens: mes.itens.map((item, i) => (i === indice ? { ...item, pago } : item)),
    });
  };

  const atualizarItem = (indice: number, patch: Partial<ItemDTO>) => {
    agendarSalvar({
      ...mes,
      itens: mes.itens.map((item, i) => (i === indice ? { ...item, ...patch } : item)),
    });
  };

  const proximaOrdem = () => mes.itens.reduce((max, item) => Math.max(max, item.ordem), -1) + 1;

  const adicionarExtraMes = (nome: string, valor: number, pago: boolean) => {
    agendarSalvar({
      ...mes,
      itens: [
        ...mes.itens,
        {
          tipo: "EXTRA_MES",
          nome: nome.trim() || "Sem nome",
          valor,
          ordem: proximaOrdem(),
          pago,
          papel: null,
        },
      ],
    });
  };

  const adicionarSaldo = (nome: string, valor: number) => {
    agendarSalvar({
      ...mes,
      itens: [
        ...mes.itens,
        {
          tipo: "SALDO",
          nome: nome.trim() || "Bico",
          valor,
          ordem: proximaOrdem(),
          pago: false,
          papel: null,
        },
      ],
    });
  };

  const trazerEntradasAnteriores = () => {
    startTransition(async () => {
      setStatus("Trazendo entradas…");
      const resposta = await trazerValoresMesAnteriorAction(mes.competencia, ["SALDO", "EXTRA"]);
      if (resposta.ok) {
        setMes(resposta.mes);
        setSujo(false);
        setStatus("Entradas do mês anterior, como previsão.");
      } else setStatus(resposta.erro);
    });
  };

  const definirFechado = (fechado: boolean) => {
    startTransition(async () => {
      if (fechado && sujo) {
        setStatus("Salvando…");
        const salvo = await salvarMesAction(comPoupancaAutomatica(mes));
        if (!salvo.ok) {
          setStatus(salvo.erro);
          return;
        }
      }
      const resposta = await definirMesFechadoAction(mes.competencia, fechado);
      if (resposta.ok) {
        setMes(resposta.mes);
        setSujo(false);
        setStatus(fechado ? "Mês fechado." : "Mês reaberto.");
      } else setStatus(resposta.erro);
    });
  };

  return {
    mes,
    totais,
    somenteLeitura: mes.fechado,
    status,
    pendente,
    sujo,
    porTipo: (tipo: TipoItem) => porTipo(mes.itens, tipo),
    atualizarItens,
    atualizarItem,
    adicionarExtraMes,
    adicionarSaldo,
    marcarPago,
    agendarSalvar,
    salvar,
    definirFechado,
    trazerEntradasAnteriores,
  };
}
