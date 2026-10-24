import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main id="conteudo" className="mx-auto max-w-[72rem] px-4 py-16 lg:px-8">
      <h1 className="titulo">Página não encontrada</h1>
      <p className="mt-3 max-w-[42ch] text-sm text-mute">
        Esse endereço não existe neste painel. Volte ao início e continue de lá.
      </p>
      <Link className="btn-primary mt-6 inline-flex" href="/">
        Abrir o início
      </Link>
    </main>
  );
}
