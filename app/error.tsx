"use client";

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-16 lg:px-8">
      <h1 className="titulo">
        Não foi possível carregar o painel
      </h1>
      <p className="mt-3 max-w-[42ch] text-sm text-mute">
        {error.message || "Tente de novo. Se o erro continuar, confira se o banco está no ar."}
      </p>
      <button className="btn-primary mt-6" type="button" onClick={() => reset()}>
        Tentar de novo
      </button>
    </main>
  );
}
