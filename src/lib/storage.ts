/**
 * Browser persistence. PRD F-5.7: an estimate survives 30 days without a login,
 * because forcing identity before the estimate loses the lead (PRD §5).
 *
 * Every read and write is guarded — private mode, cleared site data and blocked
 * storage all throw, and none of them should break the app.
 */

const NS = 'rm:';

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* Quota or blocked storage — the app must still work. */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(NS + key);
  } catch {
    /* no-op */
  }
}

/** Anonymous session id — TRD §4 `estimate.session_id`. Not a tracking id. */
export function sessionId(): string {
  let id = read<string>('session', '');
  if (!id) {
    id = 'sess-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    write('session', id);
  }
  return id;
}

export const KEYS = {
  estimates: 'estimates',
  myHouse: 'myhouse',
  compare: 'compare',
  pin: 'pin',
  lang: 'lang',
  recent: 'recent',
  enquiries: 'enquiries',
  adminSession: 'admin-session',
  adminProducts: 'admin-products',
  adminEnquiries: 'admin-enquiries',
  adminSettings: 'admin-settings',
  seq: 'ref-seq',
} as const;

/** Drops estimates past their 30-day window on read (PRD F-5.7, TRD §13.3). */
export function pruneExpired<T extends { expiresAt: string }>(rows: T[]): T[] {
  const now = Date.now();
  return rows.filter((r) => new Date(r.expiresAt).getTime() > now);
}
