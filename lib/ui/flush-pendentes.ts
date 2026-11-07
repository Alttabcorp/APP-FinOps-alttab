/**
 * Registro de "salvar o que está pendente" das telas de edição.
 * Quem navega (troca de aba, de mês) chama `salvarPendentes()` antes,
 * para o autosave com atraso não perder a última edição.
 */
type Flush = () => Promise<void>;

const registro = new Set<Flush>();

export const registrarFlush = (flush: Flush) => {
  registro.add(flush);
  return () => {
    registro.delete(flush);
  };
};

export const salvarPendentes = async () => {
  await Promise.all([...registro].map((flush) => flush().catch(() => undefined)));
};
