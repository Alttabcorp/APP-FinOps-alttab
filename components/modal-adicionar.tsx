"use client";

import Link from "next/link";
import { Modal } from "@/components/modal";

const ACOES = [
  { href: "/entradas?novo=entrada", rotulo: "Entrada", nota: "Emprego, bico, salário — cadastro e valor do mês" },
  { href: "/entradas?novo=rendimento", rotulo: "Rendimento", nota: "O que as contas rendem neste mês" },
  { href: "/gastos#extra", rotulo: "Gasto do mês", nota: "Extra, feira, gasolina ou cartão avulso" },
  { href: "/contas?novo=conta", rotulo: "Conta da casa", nota: "Meta 10 mil ou reserva de emergência" },
  { href: "/contas?novo=anual", rotulo: "Conta anual da casa", nota: "IPTU, IPVA" },
  { href: "/contas?novo=saque", rotulo: "Compra à vista com a meta", nota: "Saca, fica devendo para si e devolve aos poucos" },
  { href: "/investimentos?novo=aporte", rotulo: "Aporte do mês", nota: "Fundo, Alttab, poupança" },
  { href: "/investimentos?novo=conta", rotulo: "Conta de investimento", nota: "Ações travadas ou poupança" },
  { href: "/empresa?novo=conta", rotulo: "Conta da empresa", nota: "Para reinvestir na empresa" },
  { href: "/empresa?novo=gasto", rotulo: "Gasto da empresa", nota: "Retirada e em que foi gasto" },
  { href: "/empresa?novo=anual", rotulo: "Conta anual da empresa", nota: "Domínio, máquina virtual" },
  { href: "/cartao?novo=1", rotulo: "Compra no cartão", nota: "Parcelas entram na fatura" },
];

type Props = {
  aberto: boolean;
  onClose: () => void;
};

export function ModalAdicionar({ aberto, onClose }: Props) {
  return (
    <Modal
      aberto={aberto}
      titulo="Adicionar"
      descricao="Entrada, gasto e investimento são as páginas principais. O resto são cadastros."
      onClose={onClose}
    >
      <ul className="grid gap-2">
        {ACOES.map((acao) => (
          <li key={acao.href}>
            <Link href={acao.href} className="acao-cadastro" onClick={onClose}>
              <span>
                <span className="block font-medium">{acao.rotulo}</span>
                <span className="mt-0.5 block text-sm text-mute">{acao.nota}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
