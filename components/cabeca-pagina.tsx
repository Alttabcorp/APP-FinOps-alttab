import type { ReactNode } from "react";

type Props = {
  titulo: string;
  nota?: ReactNode;
  acao?: ReactNode;
};

export function CabecaPagina({ titulo, nota, acao }: Props) {
  return (
    <header className="pagina-cabeca">
      <div className="min-w-0">
        <h1 className="titulo">{titulo}</h1>
        {nota ? <p className="pagina-nota">{nota}</p> : null}
      </div>
      {acao ? <div className="pagina-acao">{acao}</div> : null}
    </header>
  );
}
