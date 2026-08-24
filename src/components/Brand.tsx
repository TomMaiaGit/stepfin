export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand" aria-label="StepFin"><span className="brand-mark">S</span>{!compact && <span>StepFin</span>}</div>;
}
