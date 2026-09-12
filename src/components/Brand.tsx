export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand" aria-label="StepFin"><svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18"/><path className="brand-s" d="M42 18c-4.6-4.2-17.2-5-22.5 1.4-5.3 6.5.2 12.1 11.1 13.3 10.9 1.2 15.7 6.6 10.8 13.4-5.4 7.5-19.4 7.6-27.2.8"/><path className="brand-trend" d="m36 12 7-7 7 7M43 5v14"/></svg>{!compact && <span className="brand-name">Step<span>Fin</span></span>}</div>;
}
