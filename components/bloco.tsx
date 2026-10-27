import type { ReactNode } from "react";

type Props = {
  as?: "section" | "div";
  id?: string;
  titulo?: string;
  nota?: string;
  figura?: ReactNode;
  acao?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Bloco({
  as = "section",
  id,
  titulo,
  nota,
  figura,
  acao,
  children,
  className = "",
}: Props) {
  const Tag = as;
  const tituloId = titulo && id ? `${id}-titulo` : undefined;

  return (
    <Tag className={`bloco ${className}`.trim()} id={id} aria-labelledby={tituloId}>
      {titulo || figura || acao || nota ? (
        <header className="bloco-cabeca">
          <div className="min-w-0">
            {titulo ? (
              <h2 id={tituloId} className="titulo-secao">
                {titulo}
              </h2>
            ) : null}
            {nota ? <p className="bloco-nota">{nota}</p> : null}
            {figura ? <div className="bloco-figura">{figura}</div> : null}
          </div>
          {acao ? <div className="bloco-acao">{acao}</div> : null}
        </header>
      ) : null}
      {children}
    </Tag>
  );
}
