import {
  useEffect, useId, useRef, useState, type ReactNode, type InputHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';

/* ── Bottom sheet ────────────────────────────────────────────────────────────
   PRD §10.2: anything that does not fit on the one-screen product page goes
   into a sheet, not an inline scroll. Every sheet traps focus, closes on Esc
   and on backdrop tap, and locks the body behind it.                         */

export function Sheet({
  open, onClose, title, children, footer,
}: {
  open: boolean; onClose: () => void; title: string;
  children: ReactNode; footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="sheet-panel fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-app
                   flex-col overflow-hidden rounded-t-lg border-t border-line bg-deep
                   shadow-sheet outline-none max-h-[90dvh]"
      >
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="grabber mb-3" aria-hidden />
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-[17px] font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 grid h-11 w-11 place-items-center rounded-pill text-muted active:bg-raised"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && (
          <div
            className="shrink-0 line-t bg-ink px-4 pt-3"
            style={{ paddingBottom: 'calc(12px + var(--sab))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Sticky action bar ───────────────────────────────────────────────────────
   PRD N-3.4: the primary action lives in the lower half of the screen, always
   thumb-reachable, clear of the home indicator.                              */

export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app bg-ink/95
                 backdrop-blur shadow-bar px-4 pt-3"
      style={{ paddingBottom: 'calc(12px + var(--sab))' }}
    >
      {children}
    </div>
  );
}

/** Spacer so content never hides behind the ActionBar. */
export const BarSpacer = ({ tall }: { tall?: boolean }) => (
  <div aria-hidden style={{ height: tall ? 148 : 92 }} />
);

/* ── Stepper / numeric input ─────────────────────────────────────────────── */

export function NumberField({
  label, suffix, value, onChange, min = 0, max = 9999, step = 1, hint, error, ...rest
}: {
  label: string; suffix?: string; value: string;
  onChange: (v: string) => void; hint?: string; error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-small font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className={'field pr-14 ' + (error ? 'border-danger focus:border-danger' : '')}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? id + '-d' : undefined}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-small text-muted">
            {suffix}
          </span>
        )}
      </div>
      {(hint || error) && (
        <p id={id + '-d'} className={'mt-1 text-micro ' + (error ? 'text-danger' : 'text-muted')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label, value, onChange, error, hint, ...rest
}: {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-small font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        className={'field ' + (error ? 'border-danger focus:border-danger' : '')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? id + '-d' : undefined}
        {...rest}
      />
      {(hint || error) && (
        <p id={id + '-d'} className={'mt-1 text-micro ' + (error ? 'text-danger' : 'text-muted')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

/* ── Segmented control ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options, value, onChange, ariaLabel,
}: {
  options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-0.5 rounded-sm bg-raised p-[2px]">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={
            'flex-1 rounded-[8px] px-3 text-[13px] font-semibold transition-all duration-200 ease-ios ' +
            (value === o.id
              ? 'bg-surface text-hi shadow-[0_1px_3px_rgba(0,0,0,.5)]'
              : 'text-muted active:opacity-60')
          }
          style={{ minHeight: 32 }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Accordion ───────────────────────────────────────────────────────────── */

export function Accordion({
  items, defaultOpen = -1,
}: {
  items: { id: string; title: string; body: ReactNode }[]; defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="divide-y divide-line">
      {items.map((item, i) => (
        <div key={item.id}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-3 py-4 text-left"
          >
            <span className="font-medium">{item.title}</span>
            <Icon
              name="chevron"
              className={'shrink-0 text-muted transition-transform ' + (open === i ? 'rotate-180' : '')}
            />
          </button>
          {open === i && (
            <div className="pb-4 text-small leading-relaxed text-muted">{item.body}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────── */

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-[60] mx-auto w-full max-w-app px-4"
      style={{ bottom: 'calc(96px + var(--sab))' }}
    >
      <div className="glass mx-auto w-fit rounded-pill border border-line px-5 py-3 text-center text-small font-medium text-hi shadow-card">
        {message}
      </div>
    </div>,
    document.body,
  );
}

/* ── Callout ─────────────────────────────────────────────────────────────── */

export function Callout({
  tone = 'neutral', title, children,
}: {
  tone?: 'neutral' | 'warning' | 'danger' | 'success'; title?: string; children: ReactNode;
}) {
  const tones = {
    neutral: 'border-line bg-raised text-hi',
    warning: 'border-warning/25 bg-warning/10 text-warning',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    success: 'border-success/25 bg-success/10 text-success',
  };
  return (
    <div className={'rounded-sm border px-4 py-3 text-small leading-relaxed ' + tones[tone]}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────────────────────────
   Inline so nothing blocks first paint on an icon-font request (N-1.6).      */

const PATHS: Record<string, string> = {
  close: 'M6 6l12 12M18 6L6 18',
  chevron: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  filter: 'M3 6h18M7 12h10M11 18h2',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M20 6L9 17l-5-5',
  zoom: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3M11 8v6M8 11h6',
  share: 'M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6',
  home: 'M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  calculator: 'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM9 6h6M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8',
  box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a2 2 0 100-4 2 2 0 000 4zM18.5 19a2 2 0 100-4 2 2 0 000 4z',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
  alert: 'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008.9 19a1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 8.9a1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.5-6.9A2 2 0 0016.8 4H7.2a2 2 0 00-1.7 1.1z',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  camera: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  globe: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  layers: 'M12 2l10 6-10 6L2 8zM2 16l10 6 10-6M2 12l10 6 10-6',
  chat: 'M21 11.5a8.4 8.4 0 01-9 8.4 8.8 8.8 0 01-4-1L3 21l2.1-5a8.8 8.8 0 01-1-4 8.4 8.4 0 018.4-9 8.4 8.4 0 018.5 8.5z',
};

export function Icon({
  name, className = '', size = 20, strokeWidth = 1.8,
}: { name: keyof typeof PATHS | string; className?: string; size?: number; strokeWidth?: number }) {
  const d = PATHS[name] ?? PATHS.info;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden focusable="false"
    >
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}

/* ── Skeletons (F-2.7) ───────────────────────────────────────────────────── */

export const GridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-3" aria-hidden>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card overflow-hidden">
        <div className="skeleton aspect-[4/5] w-full rounded-none" />
        <div className="space-y-2 p-3">
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-3 w-2/5" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

/* ── iOS switch ───────────────────────────────────────────────────
   Replaces the checkbox wherever the control means on/off rather than
   multi-select. A checkbox in a settings row is the fastest way to make an
   iOS app read as a web form.                                              */

export function Switch({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-base">{label}</span>
        {hint && <span className="mt-0.5 block text-micro leading-snug text-muted">{hint}</span>}
      </span>
      <span className="switch" data-on={checked} aria-hidden />
      <input
        type="checkbox"
        role="switch"
        className="sr-only"
        checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
