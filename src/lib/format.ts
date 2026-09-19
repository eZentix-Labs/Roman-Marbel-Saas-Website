/**
 * PRD N-2.3: numbers, rates and dimensions stay in Latin numerals even inside
 * Bengali copy. Every number in the app goes through this module so that rule
 * is kept in one place rather than remembered per component.
 */

export const rupees = (n: number, opts: { paise?: boolean } = {}): string =>
  '₹' + Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: opts.paise ? 2 : 0,
    maximumFractionDigits: opts.paise ? 2 : 0,
  });

export const sqft = (n: number): string =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' sq ft';

export const rate = (n: number): string => '₹' + n.toLocaleString('en-IN') + '/sq ft';

export const kg = (n: number): string =>
  n >= 1000
    ? (n / 1000).toFixed(1) + ' tonne'
    : Math.round(n).toLocaleString('en-IN') + ' kg';

export function relativeDays(iso: string, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return days + ' days ago';
  const months = Math.floor(days / 30);
  return months === 1 ? 'a month ago' : months + ' months ago';
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function timeAgo(iso: string, now = new Date()): string {
  const mins = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
  return relativeDays(iso, now);
}

/** Indian mobile: 10 digits starting 6–9, with optional +91 / 0 prefix. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export const prettyPhone = (ten: string): string =>
  ten.length === 10 ? ten.slice(0, 5) + ' ' + ten.slice(5) : ten;

/** Masked for display in any list a third party might see over the owner's shoulder. */
export const maskPhone = (ten: string): string =>
  ten.length === 10 ? ten.slice(0, 2) + '••••' + ten.slice(6) : ten;

export const titleCase = (s: string): string =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const FINISH_LABEL: Record<string, string> = {
  polished: 'Polished', honed: 'Honed', leather: 'Leather', matt: 'Matt',
  glossy: 'Glossy', anti_skid: 'Anti-skid', rustic: 'Rustic',
};

export const MATERIAL_LABEL: Record<string, string> = {
  marble: 'Marble', granite: 'Granite', vitrified: 'Vitrified',
  ceramic: 'Ceramic', other: 'Other',
};

export const STOCK_LABEL: Record<string, { en: string; bn: string; tone: string }> = {
  in: { en: 'In godown', bn: 'গুদামে আছে', tone: 'text-success' },
  low: { en: 'Low stock', bn: 'কম স্টক', tone: 'text-warning' },
  out: { en: 'Out of stock', bn: 'স্টক নেই', tone: 'text-danger' },
  on_order: { en: 'On order', bn: 'অর্ডারে আছে', tone: 'text-muted' },
};

export const BAND_LABEL: Record<string, string> = {
  economy: 'Economy', value: 'Value', premium: 'Premium',
};
