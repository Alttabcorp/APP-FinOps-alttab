import Link from "next/link";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { NavCadastros } from "@/components/nav-cadastros";
import { PainelDestinoCartao } from "@/components/painel-destino-cartao";
import { obterPreferenciaCasa } from "@/lib/application/renda-service";

export const dynamic = "force-dynamic";

const GRUPOS = [
  {
    titulo: "Casa",
    itens: [
      {
        href: "/entradas",
        rotulo: "Fontes",
        nota: "Emprego, bico, VA, VT e rendimento.",
      },
      {
        href: "/gastos",
        rotulo: "Contas que se repetem",
        nota: "Internet, energia, IPTV.",
      },
      {
        href: "/cartao",
        rotulo: "Cartão",
        nota: "Gasto fixo, parcelas e destino do PIX.",
      },
    ],
  },
  {
    titulo: "Objetivos",
    itens: [
      {
        href: "/contas",
        rotulo: "Meta",
        nota: "Objetivo de R$ 10.000, reserva e IPTU.",
      },
      {
        href: "/empresa",
        rotulo: "Empresa",
        nota: "Saldo da Alttab, gasto e anuais.",
      },
    ],
  },
];

export default async function PaginaCadastros() {
  const preferencia = await obterPreferenciaCasa();

  return (
    <main id="conteudo" className="pagina">
      <NavCadastros />
      <CabecaPagina
        titulo="Cadastros"
        nota="O mês se lança no Início. Poupança, fundo, meta e Alttab ficam em Investimentos. Aqui entra o que se repete."
      />
      <div className="lista-indice mt-8">
        {GRUPOS.map((grupo) => (
          <section key={grupo.titulo} className="indice-grupo" aria-labelledby={`cadastro-${grupo.titulo}`}>
            <h2 id={`cadastro-${grupo.titulo}`} className="titulo-secao">
              {grupo.titulo}
            </h2>
            <ul className="indice-lista">
              {grupo.itens.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span>
                      <span className="indice-rotulo">{item.rotulo}</span>
                      <span className="indice-nota">{item.nota}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <PainelDestinoCartao nome={preferencia.destinoCartaoNome} chavePix={preferencia.destinoCartaoChave} />
    </main>
  );
}
