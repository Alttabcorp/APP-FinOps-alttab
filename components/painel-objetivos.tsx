"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { excluirContaAction, salvarContaAction } from "@/app/actions/conta";
import { excluirGastoEmpresaAction, registrarGastoEmpresaAction } from "@/app/actions/gasto-empresa";
import { BarraMeta } from "@/components/barra-meta";
import { BotaoEntrada } from "@/components/botao-entrada";
import { CampoTexto } from "@/components/campo";
import { CampoMoeda } from "@/components/campo-moeda";
import { Modal } from "@/components/modal";
import { PainelEmprestimoMeta } from "@/components/painel-emprestimo-meta";
import type { EmprestimoMetaComSituacao } from "@/lib/application/emprestimo-meta-mapper";
import type { GastoEmpresaDTO } from "@/lib/application/gasto-empresa-mapper";
import type { ContaComProgresso } from "@/lib/application/conta-mapper";
import { calcularProgressoMeta, ROTULOS_FINALIDADE, usaMetaMensal } from "@/lib/domain/financeiro/conta";
import { formatarMoeda } from "@/lib/formatacao";

type Rascunho = {
  id?: string;
  nome: string;
  finalidade: ContaComProgresso["finalidade"];
  saldo: number;
  meta: number;
  metaMensal: number;
  chavePix: string;
  banco: string;
  titular: string;
  recebePoupanca: boolean;
};

const novoRascunho = (): Rascunho => ({
  nome: "",
  finalidade: "META",
  saldo: 0,
  meta: 0,
  metaMensal: 0,
  chavePix: "",
  banco: "",
  titular: "",
  recebePoupanca: false,
});

const deConta = (conta: ContaComProgresso): Rascunho => ({
  id: conta.id,
  nome: conta.nome,
  finalidade: conta.finalidade,
  saldo: conta.saldo,
  meta: conta.meta ?? 0,
  metaMensal: conta.metaMensal ?? 0,
  chavePix: conta.chavePix,
  banco: conta.banco,
  titular: conta.titular,
  recebePoupanca: conta.recebePoupanca,
});

const reduzirImagem = (arquivo: File) =>
  new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, 480 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Não foi possível ler a imagem."));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Arquivo de imagem inválido."));
    };
    img.src = url;
  });

const NOTA_CARD: Partial<Record<ContaComProgresso["finalidade"], string>> = {
  POUPANCA: "Longo prazo. Não é para retirar.",
  INVESTIMENTO: "Sem liquidez. Só o rendimento mensal cai na conta.",
};

export type ResumoAnuais = {
  total: number;
  porMes: number;
  itens: { id: string; nome: string; valor: number; quando: string }[];
};

export type ResumoRendimento = {
  total: number;
  apertado: boolean;
  paraContas: number;
  reinvestido: number;
};

type PropsPainel = {
  contas: ContaComProgresso[];
  competencia: string;
  emprestimos: EmprestimoMetaComSituacao[];
  sobraMes: number;
  gastosEmpresa: GastoEmpresaDTO[];
  rendimento: ResumoRendimento;
  /** Despesas essenciais mensais (contas fixas + feira), base da reserva de emergência. */
  essenciaisMes: number;
  mesesReserva: number;
  anuais: ResumoAnuais;
};

export function PainelObjetivos({
  contas,
  competencia,
  emprestimos,
  sobraMes,
  gastosEmpresa,
  rendimento,
  essenciaisMes,
  mesesReserva,
  anuais,
}: PropsPainel) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [status, setStatus] = useState("");
  const [pixId, setPixId] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [retiradaAberta, setRetiradaAberta] = useState(false);
  const [empresaAberta, setEmpresaAberta] = useState(false);
  const [gasto, setGasto] = useState({ nome: "", valor: 0, nota: "" });
  const [erroGasto, setErroGasto] = useState("");

  const contaPix = contas.find((conta) => conta.id === pixId) ?? null;
  const metaReserva = Math.round(essenciaisMes * mesesReserva * 100) / 100;
  const dasCaixa = (...finalidades: ContaComProgresso["finalidade"][]) =>
    contas.filter((conta) => finalidades.includes(conta.finalidade));

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  };

  const salvarQr = (conta: ContaComProgresso, qrCode: string) => {
    startTransition(async () => {
      const resposta = await salvarContaAction({
        id: conta.id,
        nome: conta.nome,
        finalidade: conta.finalidade,
        saldo: conta.saldo,
        meta: conta.meta,
        metaMensal: conta.metaMensal,
        banco: conta.banco,
        titular: conta.titular,
        chavePix: conta.chavePix,
        recebePoupanca: conta.recebePoupanca,
        qrCode,
      });
      setStatus(resposta.ok ? "QR code salvo." : resposta.erro);
      if (resposta.ok) router.refresh();
    });
  };

  const enviarQr = async (conta: ContaComProgresso, arquivo: File | undefined) => {
    if (!arquivo) return;
    try {
      salvarQr(conta, await reduzirImagem(arquivo));
    } catch (erro) {
      setStatus(erro instanceof Error ? erro.message : "Não foi possível ler a imagem.");
    }
  };

  const salvarRascunho = () => {
    if (!rascunho) return;
    startTransition(async () => {
      const resposta = await salvarContaAction({
        id: rascunho.id,
        nome: rascunho.nome,
        finalidade: rascunho.finalidade,
        saldo: rascunho.saldo,
        meta: rascunho.meta,
        metaMensal: rascunho.metaMensal,
        banco: rascunho.banco,
        titular: rascunho.titular,
        chavePix: rascunho.chavePix,
        recebePoupanca: rascunho.recebePoupanca,
      });
      if (resposta.ok) {
        setStatus(`${rascunho.nome} salvo.`);
        setRascunho(null);
        router.refresh();
      } else setStatus(resposta.erro);
    });
  };

  const registrarGasto = () => {
    setErroGasto("");
    startTransition(async () => {
      const resposta = await registrarGastoEmpresaAction({ ...gasto, competencia });
      if (resposta.ok) {
        setStatus(`Retirada de ${formatarMoeda(gasto.valor)} para a empresa registrada.`);
        setGasto({ nome: "", valor: 0, nota: "" });
        router.refresh();
      } else setErroGasto(resposta.erro);
    });
  };

  const desfazerGasto = (id: string) => {
    startTransition(async () => {
      const resposta = await excluirGastoEmpresaAction(id);
      if (resposta.ok) router.refresh();
      else setErroGasto(resposta.erro);
    });
  };

  const remover = () => {
    if (!rascunho?.id) return;
    if (!window.confirm(`Remover "${rascunho.nome}"? Isso não pode ser desfeito.`)) return;
    const id = rascunho.id;
    startTransition(async () => {
      const resposta = await excluirContaAction(id);
      if (resposta.ok) {
        setStatus("Objetivo removido.");
        setRascunho(null);
        router.refresh();
      } else setStatus(resposta.erro);
    });
  };

  const card = (original: ContaComProgresso) => {
    const conta =
      original.finalidade === "RESERVA"
        ? { ...original, meta: metaReserva, progresso: calcularProgressoMeta(original.saldo, metaReserva) }
        : original;
    return (
    <li key={conta.id} className="objetivo-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{conta.nome}</h3>
          <p className="text-xs text-mute">{ROTULOS_FINALIDADE[conta.finalidade]}</p>
        </div>
        <p className="money shrink-0 text-sm font-medium">{formatarMoeda(conta.saldo)}</p>
      </div>
      {conta.progresso.temMeta ? (
        <BarraMeta nome={conta.nome} progresso={conta.progresso} />
      ) : (
        <p className="text-xs text-mute">Sem valor de objetivo definido.</p>
      )}
      {NOTA_CARD[conta.finalidade] ? <p className="text-xs text-mute">{NOTA_CARD[conta.finalidade]}</p> : null}
      {usaMetaMensal(conta.finalidade) && conta.progressoMensal.temMeta ? (
        <p className="text-xs text-mute">Renda mensal alvo {formatarMoeda(conta.progressoMensal.meta)}</p>
      ) : null}
      <div className="objetivo-acoes">
        <button type="button" className="btn-primary flex-1 text-sm" onClick={() => setPixId(conta.id)}>
          Pix
        </button>
        <BotaoEntrada contas={[{ id: conta.id, nome: conta.nome }]} contaId={conta.id} rotulo="Entrada" />
        <button type="button" className="btn text-sm" onClick={() => setRascunho(deConta(conta))}>
          Editar
        </button>
      </div>
    </li>
    );
  };

  const caixa = (
    numero: number,
    id: string,
    titulo: string,
    funcao: string,
    conteudo: React.ReactNode,
    acao?: React.ReactNode,
    largo = false,
  ) => (
    <section className={`caixa ${largo ? "caixa-larga" : ""}`} aria-labelledby={id}>
      <header className="caixa-topo">
        <span className="caixa-numero" aria-hidden="true">
          {numero}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={id} className="caixa-titulo">
            {titulo}
          </h2>
          <p className="caixa-funcao">{funcao}</p>
        </div>
        {acao}
      </header>
      <div className="caixa-corpo">{conteudo}</div>
    </section>
  );

  const editando = rascunho?.id ? contas.find((conta) => conta.id === rascunho.id) : null;

  return (
    <>
      <div className="caixas-grade">
      {caixa(
        1,
        "cx-emergencia",
        "Reserva de emergência",
        "Dinheiro para imprevistos, construído aos poucos ao longo do tempo. A meta é 6 vezes o que você gasta por mês e acompanha o seu gasto: se as despesas sobem, a meta sobe junto.",
        <>
          <p className="caixa-nota">
            Meta: <strong className="money">{formatarMoeda(metaReserva)}</strong>{" "}
            <span className="text-mute">
              = {mesesReserva} meses × {formatarMoeda(essenciaisMes)} de gasto mensal (contas, anuais, feira, gasolina e cartão)
            </span>
          </p>
          <ul className="objetivos-grade">{dasCaixa("RESERVA").map(card)}</ul>
        </>,
      )}

      {caixa(
        2,
        "cx-anuais",
        "Despesas anuais",
        "IPVA, licenciamento, seguros e impostos. Guarde um pouco por mês para o vencimento não consumir a reserva.",
        anuais.itens.length === 0 ? (
          <p className="text-sm text-mute">
            Nenhuma conta anual da casa cadastrada. <Link className="underline" href="/anuais">Cadastrar</Link>
          </p>
        ) : (
          <div className="objetivo-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm">
                Total no ano <strong className="money">{formatarMoeda(anuais.total)}</strong>
              </p>
              <p className="text-sm">
                Guardar por mês <strong className="money">{formatarMoeda(anuais.porMes)}</strong>
              </p>
            </div>
            <ul className="text-sm">
              {anuais.itens.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 border-t border-line py-2">
                  <span className="min-w-0 truncate">
                    {item.nome} <span className="text-mute">· {item.quando}</span>
                  </span>
                  <span className="money shrink-0">{formatarMoeda(item.valor)}</span>
                </li>
              ))}
            </ul>
          </div>
        ),
        <Link className="btn text-sm" href="/anuais">
          Contas anuais
        </Link>,
      )}

      {caixa(
        3,
        "cx-empresa",
        "Caixa da empresa",
        "O dinheiro é da empresa. Pode retirar para comprar coisas para ela; a retirada fica registrada e baixa o saldo.",
        <>
          <ul className="objetivos-grade">{dasCaixa("EMPRESA").map(card)}</ul>
          {gastosEmpresa.length > 0 ? (
            <ul className="text-sm">
              {gastosEmpresa.slice(0, 4).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 border-t border-line py-2">
                  <span className="min-w-0 truncate">
                    {item.nome} <span className="text-mute">· {item.competencia}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="money">{formatarMoeda(item.valor)}</span>
                    <button type="button" className="underline text-xs text-mute" disabled={pendente} onClick={() => desfazerGasto(item.id)}>
                      Desfazer
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <Link className="text-sm underline" href="/transacoes">
            Ver todas as transações
          </Link>
        </>,
        <button type="button" className="btn-primary text-sm" onClick={() => setEmpresaAberta(true)}>
          Retirar para a empresa
        </button>,
      )}

      {caixa(
        4,
        "cx-renda",
        "Patrimônio gerador de renda",
        "O dinheiro investido não tem liquidez: só o rendimento mensal cai na conta. Em mês apertado o rendimento paga as contas; fora disso é reinvestido. Renda variável, pode oscilar.",
        <>
          <p className="caixa-nota">
            Rendimento deste mês: <strong className="money">{formatarMoeda(rendimento.total)}</strong>{" "}
            <span className="text-mute">
              {rendimento.total < 0.005
                ? "· nenhum rendimento lançado"
                : rendimento.apertado
                  ? `· mês apertado: ${formatarMoeda(rendimento.paraContas)} vai para as contas`
                  : `· reinvestido: ${formatarMoeda(rendimento.reinvestido)}`}
            </span>
          </p>
          <ul className="objetivos-grade">{dasCaixa("INVESTIMENTO").map(card)}</ul>
        </>,
      )}

      {caixa(
        5,
        "cx-pessoais",
        "Poupança e metas",
        "A poupança é longo prazo, para objetivos de longo prazo. As metas (viagem, móvel) têm liquidez: se precisar, retire, e o valor vira uma dívida com você mesmo, paga em parcelas.",
        <>
          <ul className="objetivos-grade">{dasCaixa("POUPANCA", "META").map(card)}</ul>
          {emprestimos.some((item) => !item.quitado) ? (
            <p className="caixa-nota">
              A repor nas metas:{" "}
              <strong className="money">
                {formatarMoeda(emprestimos.reduce((acc, item) => acc + item.aberto, 0))}
              </strong>
            </p>
          ) : null}
        </>,
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn text-sm" onClick={() => setRetiradaAberta(true)}>
            Retirar / repor
          </button>
          <button type="button" className="btn-primary text-sm" onClick={() => setRascunho(novoRascunho())}>
            Nova meta
          </button>
        </div>,
        true,
      )}
      </div>

      {status ? (
        <p className="mt-4 text-sm text-mute" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      <Modal
        aberto={contaPix !== null}
        titulo={contaPix ? `Pix · ${contaPix.nome}` : "Pix"}
        descricao="Escaneie o QR code ou copie a chave."
        onClose={() => setPixId(null)}
      >
        {contaPix ? (
          <div className="grid gap-4">
            <div className="pix-qr">
              {contaPix.qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contaPix.qrCode} alt={`QR code Pix de ${contaPix.nome}`} />
              ) : (
                <p className="text-sm text-mute">QR code ainda não cadastrado.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="btn cursor-pointer text-sm">
                {contaPix.qrCode ? "Trocar QR code" : "Enviar QR code"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={pendente}
                  onChange={(evento) => {
                    void enviarQr(contaPix, evento.target.files?.[0]);
                    evento.target.value = "";
                  }}
                />
              </label>
              {contaPix.qrCode ? (
                <button type="button" className="btn text-sm" disabled={pendente} onClick={() => salvarQr(contaPix, "")}>
                  Remover QR code
                </button>
              ) : null}
            </div>
            {contaPix.chavePix ? (
              <div>
                <p className="kpi-rotulo">Chave Pix{contaPix.titular ? ` · ${contaPix.titular}` : ""}</p>
                <p className="money mt-1 break-all rounded-lg bg-[var(--panel)] p-3 text-sm">{contaPix.chavePix}</p>
                <button type="button" className="btn-primary mt-2 w-full" onClick={() => void copiar(contaPix.chavePix)}>
                  {copiado ? "Chave copiada ✓" : "Copiar chave"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-mute">
                Nenhuma chave Pix cadastrada.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setPixId(null);
                    setRascunho(deConta(contaPix));
                  }}
                >
                  Cadastrar agora
                </button>
              </p>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        aberto={rascunho !== null}
        titulo={rascunho?.id ? "Editar objetivo" : "Nova meta"}
        descricao="Uma conta para cada objetivo."
        onClose={() => setRascunho(null)}
      >
        {rascunho ? (
          <form
            className="grid gap-3"
            onSubmit={(evento) => {
              evento.preventDefault();
              salvarRascunho();
            }}
          >
            <CampoTexto
              id="obj-nome"
              label="Nome"
              value={rascunho.nome}
              placeholder="Ex.: Viagem, Sofá novo"
              autoFocus
              onChange={(nome) => setRascunho({ ...rascunho, nome })}
            />
            <CampoMoeda
              id="obj-meta"
              label="Valor do objetivo"
              value={rascunho.meta}
              onChange={(meta) => setRascunho({ ...rascunho, meta })}
            />
            <CampoMoeda
              id="obj-saldo"
              label="Quanto já tem"
              value={rascunho.saldo}
              onChange={(saldo) => setRascunho({ ...rascunho, saldo })}
            />
            {usaMetaMensal(rascunho.finalidade) ? (
              <CampoMoeda
                id="obj-mensal"
                label="Renda mensal alvo"
                value={rascunho.metaMensal}
                onChange={(metaMensal) => setRascunho({ ...rascunho, metaMensal })}
              />
            ) : null}
            <CampoTexto
              id="obj-pix"
              label="Chave Pix"
              value={rascunho.chavePix}
              onChange={(chavePix) => setRascunho({ ...rascunho, chavePix })}
            />
            <CampoTexto
              id="obj-banco"
              label="Banco"
              value={rascunho.banco}
              onChange={(banco) => setRascunho({ ...rascunho, banco })}
            />
            <CampoTexto
              id="obj-titular"
              label="Titular"
              value={rascunho.titular}
              onChange={(titular) => setRascunho({ ...rascunho, titular })}
            />
            <div className="flex flex-wrap justify-between gap-2 pt-1">
              {rascunho.id && editando?.finalidade === "META" ? (
                <button type="button" className="btn text-sm text-outflow" disabled={pendente} onClick={remover}>
                  Remover
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className="btn-primary" disabled={pendente}>
                {pendente ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        aberto={retiradaAberta}
        titulo="Retiradas da meta e da reserva"
        descricao="O valor sai agora. Você escolhe em quantas vezes repor, e a parcela entra como conta do mês. Ex.: retirou R$ 100 num mês apertado? Reponha em 2x de R$ 50."
        onClose={() => setRetiradaAberta(false)}
        largura="lg"
      >
        <div className="retirada-modal">
          <PainelEmprestimoMeta
            emprestimos={emprestimos}
            contas={contas.filter((conta) => conta.finalidade === "META" || conta.finalidade === "RESERVA")}
            sobraMes={sobraMes}
          />
        </div>
      </Modal>

      <Modal
        aberto={empresaAberta}
        titulo="Retirar para a empresa"
        descricao="Registre a compra feita com o dinheiro do caixa da empresa."
        onClose={() => setEmpresaAberta(false)}
      >
        <form
          className="grid gap-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            registrarGasto();
          }}
        >
          <CampoTexto
            id="emp-nome"
            label="O que foi comprado"
            value={gasto.nome}
            placeholder="Ex.: Filamento, manutenção"
            autoFocus
            onChange={(nome) => setGasto({ ...gasto, nome })}
          />
          <CampoMoeda id="emp-valor" label="Valor" value={gasto.valor} onChange={(valor) => setGasto({ ...gasto, valor })} />
          <CampoTexto id="emp-nota" label="Observação" value={gasto.nota} onChange={(nota) => setGasto({ ...gasto, nota })} />
          {erroGasto ? (
            <p className="text-sm text-outflow" role="alert">
              {erroGasto}
            </p>
          ) : null}
          <button type="submit" className="btn-primary" disabled={pendente}>
            {pendente ? "Salvando…" : "Registrar retirada"}
          </button>
        </form>
      </Modal>
    </>
  );
}
