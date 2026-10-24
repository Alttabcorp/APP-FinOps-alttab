type Props = {
  pagas?: number;
  total?: number;
};

export function SeloContas({ pagas = 0, total = 0 }: Props) {
  if (total === 0) return <span className="text-xs text-mute">sem contas</span>;
  if (pagas >= total) return <span className="selo-pago">em dia</span>;
  const falta = total - pagas;
  return (
    <span className="text-xs text-outflow">
      {falta === 1 ? "falta 1" : `faltam ${falta}`}
    </span>
  );
}
