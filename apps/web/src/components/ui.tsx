import type { ReactNode } from 'react';

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label="Progression de la session"
    >
      <div className="progress__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  return <span className={`badge${tone === 'default' ? '' : ` badge--${tone}`}`}>{children}</span>;
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <h2>{title}</h2>
      {children ? <p className="muted">{children}</p> : null}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="switch">
      <div>
        <div>{label}</div>
        {description ? <div className="muted">{description}</div> : null}
      </div>
      <button
        type="button"
        className="toggle"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

/** Formate une durée en jours pour l'affichage sous les boutons de notation. */
export function formatInterval(days: number): string {
  if (days <= 0) return '< 10 min';
  if (days === 1) return '1 jour';
  if (days < 30) return `${days} jours`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '1 mois' : `${months} mois`;
  }
  const years = (days / 365).toFixed(1).replace('.', ',');
  return `${years} ans`;
}

/** Formate une durée en millisecondes, pour le temps passé. */
export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  // Forme courte : ces valeurs s'affichent dans des tuiles étroites, où une
  // phrase déborde et casse la grille.
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest.toString().padStart(2, '0')}`;
}
