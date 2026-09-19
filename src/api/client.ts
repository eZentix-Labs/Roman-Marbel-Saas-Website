import type {
  ApiEnvelope, CalcRequest, CalcResult, Category, Enquiry, Estimate, Order, Product, Settings, Zone,
} from '@/types';
import { calculate, CalcValidationError, makeReferenceNo } from '@/lib/calc';
import { PRODUCTS } from './mock/products';
import { CATEGORIES } from './mock/categories';
import { ZONES } from './mock/zones';
import { SETTINGS } from './mock/settings';
import { ORDERS } from './mock/orders';
import { KEYS, read, sessionId, write } from '@/lib/storage';

/**
 * The seam between the UI and the backend.
 *
 * Every function here has the exact name, arguments and response envelope of
 * the endpoint it stands in for in TRD §5 — `{ data, error }`, error shaped
 * `{ code, message, fields? }`. To go live, replace each body with a `fetch`
 * to the same path. Nothing above this file changes.
 *
 * Deliberately NOT faked here, because faking them would be worse than leaving
 * them obviously absent:
 *   - OTP: verifyOtp accepts a fixed demo code and says so in the UI. A real
 *     OTP needs MSG91/DLT (TRD §9.2) and is the only thing standing between the
 *     owner and junk leads.
 *   - Razorpay advance payment: the flow is present up to the handoff and stops
 *     there. There is no client-side way to take money honestly.
 *   - Colour auto-tagging: colours are authored in the seed rather than
 *     extracted; k-means on upload is a server job (TRD §7.3).
 */

const LATENCY = 180; // Enough to make loading and skeleton states real, not decorative.

const ok = <T>(data: T): ApiEnvelope<T> => ({ data, error: null });
const fail = <T>(code: string, message: string, fields?: Record<string, string>): ApiEnvelope<T> =>
  ({ data: null, error: { code, message, fields } });

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------------------------------------------------------------------
// Catalogue overlay — admin edits are held in localStorage so the owner's
// changes survive a reload without a backend. Reads merge overlay over seed.
// ---------------------------------------------------------------------------

type Overlay = Record<string, Partial<Product>>;

const overlay = (): Overlay => read<Overlay>(KEYS.adminProducts, {});

function withOverlay(p: Product): Product {
  const patch = overlay()[p.id];
  return patch ? { ...p, ...patch } : p;
}

export function allProducts(): Product[] {
  const custom = Object.values(overlay()).filter((p) => p.id?.startsWith('p-custom-')) as Product[];
  return [...PRODUCTS.map(withOverlay), ...custom];
}

const published = () => allProducts().filter((p) => p.isPublished);

export function currentSettings(): Settings {
  return { ...SETTINGS, ...read<Partial<Settings>>(KEYS.adminSettings, {}) };
}

// ---------------------------------------------------------------------------
// GET /api/v1/categories · GET /api/v1/zones/lookup
// ---------------------------------------------------------------------------

export const getCategories = (): Promise<ApiEnvelope<Category[]>> => delay(ok(CATEGORIES));

export const getZones = (): Promise<ApiEnvelope<Zone[]>> => delay(ok(ZONES));

export function lookupZone(pin: string): Promise<ApiEnvelope<Zone | null>> {
  const zone = ZONES.find((z) => z.pinCodes.includes(pin.trim())) ?? null;
  return delay(ok(zone), 90);
}

export const getSettings = (): Promise<ApiEnvelope<Settings>> => delay(ok(currentSettings()));

// ---------------------------------------------------------------------------
// GET /api/v1/products
// ---------------------------------------------------------------------------

export interface ProductQuery {
  category?: string;
  colour?: string[];
  material?: string[];
  size?: string[];
  finish?: string[];
  budgetBand?: string[];
  rateMin?: number;
  rateMax?: number | null;
  room?: string;
  application?: string[];
  inStockOnly?: boolean;
  sort?: 'relevance' | 'rate_asc' | 'rate_desc' | 'newest';
  page?: number;
  pageSize?: number;
  q?: string;
}

/**
 * PRD F-2.5 — search has to survive how people actually type. "marbel" is the
 * shop's own name; "bathrum tils" is a real query. A Banglish map plus a loose
 * substring match gets most of the way without a search service.
 */
const BANGLISH: Record<string, string> = {
  marbel: 'marble', marble: 'marble', মার্বেল: 'marble',
  tils: 'tile', tiles: 'tile', tails: 'tile', টাইল: 'tile',
  granit: 'granite', granait: 'granite', গ্রানাইট: 'granite',
  bathrum: 'bathroom', bathrom: 'bathroom', baathroom: 'bathroom', বাথরুম: 'bathroom',
  kichen: 'kitchen', kitchan: 'kitchen', রান্নাঘর: 'kitchen',
  kalo: 'black', কালো: 'black', shada: 'white', সাদা: 'white',
  sada: 'white', khoyeri: 'brown', বাদামি: 'brown',
  dhusor: 'grey', ধূসর: 'grey', kath: 'wood', কাঠ: 'wood',
  siri: 'stairs', সিঁড়ি: 'stairs', parking: 'parking', পার্কিং: 'parking',
  deyal: 'wall', দেয়াল: 'wall', mejhe: 'floor', মেঝে: 'floor',
  vitrified: 'vitrified', vitrifide: 'vitrified', bhitrified: 'vitrified',
};

function normaliseQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => BANGLISH[t] ?? t);
}

function matchesQuery(p: Product, tokens: string[]): boolean {
  if (!tokens.length) return true;
  const hay = [
    p.nameEn, p.nameBn, p.sku, p.material, p.finish, p.sizeMm,
    ...p.colourFamily, ...p.application, p.budgetBand,
  ].join(' ').toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

export function getProducts(q: ProductQuery = {}): Promise<ApiEnvelope<{
  items: Product[]; total: number; page: number; pageSize: number; hasMore: boolean;
}>> {
  let rows = published();

  if (q.category) rows = rows.filter((p) => p.categoryId === q.category);
  if (q.colour?.length) rows = rows.filter((p) => p.colourFamily.some((c) => q.colour!.includes(c)));
  if (q.material?.length) rows = rows.filter((p) => q.material!.includes(p.material));
  if (q.size?.length) rows = rows.filter((p) => q.size!.includes(p.sizeMm));
  if (q.finish?.length) rows = rows.filter((p) => q.finish!.includes(p.finish));
  if (q.budgetBand?.length) rows = rows.filter((p) => q.budgetBand!.includes(p.budgetBand));
  if (q.application?.length) {
    rows = rows.filter((p) => p.application.some((a) => q.application!.includes(a)));
  }
  if (typeof q.rateMin === 'number') rows = rows.filter((p) => p.ratePerSqft >= q.rateMin!);
  if (typeof q.rateMax === 'number' && q.rateMax !== null) {
    rows = rows.filter((p) => p.ratePerSqft <= q.rateMax!);
  }
  if (q.inStockOnly) rows = rows.filter((p) => p.stockStatus === 'in' || p.stockStatus === 'low');
  if (q.q) rows = rows.filter((p) => matchesQuery(p, normaliseQuery(q.q!)));

  switch (q.sort) {
    case 'rate_asc': rows = [...rows].sort((a, b) => a.ratePerSqft - b.ratePerSqft); break;
    case 'rate_desc': rows = [...rows].sort((a, b) => b.ratePerSqft - a.ratePerSqft); break;
    case 'newest':
      rows = [...rows].sort((a, b) => +new Date(b.rateUpdatedAt) - +new Date(a.rateUpdatedAt));
      break;
    default:
      // Relevance: featured and in-stock first, then the rest in catalogue order.
      rows = [...rows].sort((a, b) => {
        const s = (p: Product) =>
          (p.isFeatured ? 2 : 0) + (p.stockStatus === 'in' ? 1 : 0);
        return s(b) - s(a);
      });
  }

  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 12;
  const total = rows.length;
  const items = rows.slice((page - 1) * pageSize, page * pageSize);

  return delay(ok({ items, total, page, pageSize, hasMore: page * pageSize < total }));
}

export function getProduct(slug: string): Promise<ApiEnvelope<Product>> {
  const p = published().find((x) => x.slug === slug);
  return p
    ? delay(ok(p))
    : delay(fail<Product>('NOT_FOUND', 'That product is no longer listed.'));
}

/**
 * GET /api/v1/products/:slug/similar. Phase 2 does this with a perceptual
 * embedding (PRD §12.2); this is the honest interim — same colour family and a
 * nearby rate, which is what "I like this one but cheaper" actually means.
 */
export function getSimilar(slug: string, limit = 6): Promise<ApiEnvelope<Product[]>> {
  const base = published().find((p) => p.slug === slug);
  if (!base) return delay(ok<Product[]>([]));
  const scored = published()
    .filter((p) => p.id !== base.id)
    .map((p) => {
      const colour = p.colourFamily.filter((c) => base.colourFamily.includes(c)).length * 3;
      const app = p.application.filter((a) => base.application.includes(a)).length * 2;
      const material = p.material === base.material ? 2 : 0;
      const rateGap = Math.abs(p.ratePerSqft - base.ratePerSqft) / Math.max(base.ratePerSqft, 1);
      return { p, score: colour + app + material - rateGap * 2 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
  return delay(ok(scored));
}

// ---------------------------------------------------------------------------
// POST /api/v1/calculate — thin wrapper over the pure engine, exactly as
// TRD §5.2 requires. Rates are read from the catalogue here, never from the
// client (TRD T2).
// ---------------------------------------------------------------------------

export function postCalculate(req: CalcRequest): Promise<ApiEnvelope<CalcResult>> {
  try {
    const snapshot = { getProduct: (id: string) => allProducts().find((p) => p.id === id) };
    const result = calculate(req, snapshot, currentSettings(), ZONES, 'retail');
    return delay(ok(result), 140);
  } catch (e) {
    if (e instanceof CalcValidationError) {
      return delay(fail<CalcResult>(e.code, e.message, e.field ? { [e.field]: e.message } : undefined));
    }
    return delay(fail<CalcResult>('INTERNAL', 'Could not work that out. Please check the numbers.'));
  }
}

// ---------------------------------------------------------------------------
// Estimates — POST /api/v1/estimates, GET /api/v1/estimates/:reference_no
// ---------------------------------------------------------------------------

function nextSeq(): number {
  const n = read<number>(KEYS.seq, 146) + 1;
  write(KEYS.seq, n);
  return n;
}

export function saveEstimate(
  input: Omit<Estimate, 'referenceNo' | 'sessionId' | 'createdAt' | 'expiresAt'>,
): Promise<ApiEnvelope<Estimate>> {
  const now = new Date();
  const estimate: Estimate = {
    ...input,
    referenceNo: makeReferenceNo(now, nextSeq()),
    sessionId: sessionId(),
    createdAt: now.toISOString(),
    // PRD F-5.7 — 30 days, no login.
    expiresAt: new Date(now.getTime() + 30 * 86400000).toISOString(),
  };
  const rows = read<Estimate[]>(KEYS.estimates, []);
  write(KEYS.estimates, [estimate, ...rows].slice(0, 40));
  return delay(ok(estimate), 120);
}

export function listEstimates(): Estimate[] {
  const rows = read<Estimate[]>(KEYS.estimates, []);
  const live = rows.filter((r) => new Date(r.expiresAt).getTime() > Date.now());
  if (live.length !== rows.length) write(KEYS.estimates, live);
  return live;
}

export function getEstimate(ref: string): Promise<ApiEnvelope<Estimate>> {
  const found = listEstimates().find((e) => e.referenceNo === ref);
  return found
    ? delay(ok(found))
    : delay(fail<Estimate>('NOT_FOUND', 'That estimate has expired or was made on another device.'));
}

// ---------------------------------------------------------------------------
// OTP — POST /api/v1/otp/request, /api/v1/otp/verify
// ---------------------------------------------------------------------------

/**
 * There is no honest way to send an SMS from a browser. This stands in for
 * MSG91/Fast2SMS (TRD §9.2) and the UI says plainly that it is a demo code, so
 * nobody mistakes the frontend for a working verification path.
 */
export const DEMO_OTP = '123456';

export function requestOtp(phone: string): Promise<ApiEnvelope<{ sent: boolean; demoCode: string }>> {
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return delay(fail('VALIDATION_ERROR', 'Enter a 10-digit mobile number.', { phone: 'Invalid number' }));
  }
  return delay(ok({ sent: true, demoCode: DEMO_OTP }), 600);
}

export function verifyOtp(phone: string, code: string): Promise<ApiEnvelope<{ token: string }>> {
  if (code !== DEMO_OTP) {
    return delay(fail('OTP_INVALID', 'That code is not right. Try again.', { code: 'Incorrect code' }), 400);
  }
  return delay(ok({ token: 'verified:' + phone + ':' + Date.now() }), 400);
}

// ---------------------------------------------------------------------------
// Enquiries — POST /api/v1/enquiries
// ---------------------------------------------------------------------------

/**
 * PRD §12.2 Tier 1 "lead scoring", implemented as the weighted rules the PRD
 * recommends over a model. The owner calls the ₹80,000 Zone-A lead before the
 * ₹6,000 Zone-C one.
 */
export function scoreLead(input: {
  estimatedValue: number; zoneId: string | null; source: string; hasEstimate: boolean;
}): number {
  let score = 0;
  score += Math.min(50, Math.round(input.estimatedValue / 2000));
  if (input.zoneId === 'zone-a') score += 20;
  else if (input.zoneId === 'zone-b') score += 12;
  else if (input.zoneId === 'zone-c') score += 5;
  if (input.hasEstimate) score += 15;
  if (input.source === 'wizard' || input.source === 'myhouse') score += 10;
  return Math.max(1, Math.min(100, score));
}

export function submitEnquiry(input: {
  estimateRef: string | null;
  name: string; phone: string; pinCode: string;
  preferredContactTime: string; message?: string;
  type: Enquiry['type'];
  estimatedValue: number; productSummary: string; quantitySummary: string;
  sourcePage: string; verifiedPhoneToken: string;
}): Promise<ApiEnvelope<Enquiry>> {
  if (!input.verifiedPhoneToken.startsWith('verified:')) {
    return delay(fail<Enquiry>('UNVERIFIED_PHONE', 'Please verify your phone number first.'));
  }
  const zone = ZONES.find((z) => z.pinCodes.includes(input.pinCode)) ?? null;
  const enquiry: Enquiry = {
    id: 'enq-' + Date.now().toString(36),
    estimateRef: input.estimateRef,
    name: input.name.trim(),
    phone: input.phone,
    phoneVerified: true,
    pinCode: input.pinCode,
    zoneName: zone?.name ?? null,
    preferredContactTime: input.preferredContactTime,
    message: input.message ?? '',
    type: input.type,
    status: 'new',
    lostReason: null,
    leadScore: scoreLead({
      estimatedValue: input.estimatedValue,
      zoneId: zone?.id ?? null,
      source: input.sourcePage,
      hasEstimate: Boolean(input.estimateRef),
    }),
    estimatedValue: input.estimatedValue,
    productSummary: input.productSummary,
    quantitySummary: input.quantitySummary,
    sourcePage: input.sourcePage,
    notes: [],
    createdAt: new Date().toISOString(),
    lastContactedAt: null,
  };
  // TRD §9.1: the enquiry row is written before the WhatsApp link fires and
  // never depends on it. The admin inbox, not WhatsApp, is the source of truth.
  const rows = read<Enquiry[]>(KEYS.adminEnquiries, []);
  write(KEYS.adminEnquiries, [enquiry, ...rows]);
  return delay(ok(enquiry), 500);
}

// ---------------------------------------------------------------------------
// Orders — GET /api/v1/orders?phone=&otp_token=
// ---------------------------------------------------------------------------

export function lookupOrders(phone: string, token: string): Promise<ApiEnvelope<Order[]>> {
  if (!token.startsWith('verified:')) {
    return delay(fail<Order[]>('UNAUTHORIZED', 'Verify your phone number to see your orders.'));
  }
  // TRD §8.5 — the token is scoped to exactly the phone that was verified and
  // cannot be replayed to read someone else's orders.
  if (!token.startsWith('verified:' + phone + ':')) {
    return delay(fail<Order[]>('FORBIDDEN', 'That code was issued for a different number.'));
  }
  return delay(ok(ORDERS.filter((o) => o.phone === phone)), 400);
}

export function getOrder(code: string): Promise<ApiEnvelope<Order>> {
  const o = ORDERS.find((x) => x.orderCode === code);
  return o ? delay(ok(o)) : delay(fail<Order>('NOT_FOUND', 'No order with that code.'));
}

// ---------------------------------------------------------------------------
// Admin — /api/v1/admin/*
// ---------------------------------------------------------------------------

export const ADMIN_DEMO = { phone: '7383695415', password: 'roman123' };

export function adminLogin(phone: string, password: string): Promise<ApiEnvelope<{ name: string; role: string }>> {
  if (phone === ADMIN_DEMO.phone && password === ADMIN_DEMO.password) {
    return delay(ok({ name: 'Owner', role: 'owner' }), 400);
  }
  return delay(fail('INVALID_CREDENTIALS', 'Wrong phone or password.'), 500);
}

/** PATCH /api/v1/admin/products/:id — single-field patch (PRD A-1.3). */
export function patchProduct(id: string, patch: Partial<Product>): Promise<ApiEnvelope<Product>> {
  const current = overlay();
  const base = allProducts().find((p) => p.id === id);
  if (!base) return delay(fail<Product>('NOT_FOUND', 'No such product.'));
  const merged = { ...current, [id]: { ...(current[id] ?? {}), ...patch } };
  write(KEYS.adminProducts, merged);
  return delay(ok({ ...base, ...patch }), 120);
}

export function createProduct(p: Product): Promise<ApiEnvelope<Product>> {
  const current = overlay();
  write(KEYS.adminProducts, { ...current, [p.id]: p });
  return delay(ok(p), 200);
}

/** PATCH /api/v1/admin/products/bulk-rate (PRD A-1.6). */
export function bulkRateChange(categoryId: string, pctChange: number): Promise<ApiEnvelope<{ updated: number }>> {
  const current = overlay();
  let updated = 0;
  for (const p of allProducts()) {
    if (p.categoryId !== categoryId) continue;
    const next = Math.round(p.ratePerSqft * (1 + pctChange / 100));
    current[p.id] = {
      ...(current[p.id] ?? {}),
      ratePerSqft: next,
      rateUpdatedAt: new Date().toISOString(),
    };
    updated++;
  }
  write(KEYS.adminProducts, current);
  return delay(ok({ updated }), 300);
}

export function listEnquiries(): Enquiry[] {
  return read<Enquiry[]>(KEYS.adminEnquiries, []);
}

export function patchEnquiry(id: string, patch: Partial<Enquiry>): Promise<ApiEnvelope<Enquiry>> {
  const rows = listEnquiries();
  const i = rows.findIndex((e) => e.id === id);
  if (i < 0) return delay(fail<Enquiry>('NOT_FOUND', 'No such enquiry.'));
  rows[i] = { ...rows[i], ...patch };
  write(KEYS.adminEnquiries, rows);
  return delay(ok(rows[i]), 120);
}

export function saveSettings(patch: Partial<Settings>): Promise<ApiEnvelope<Settings>> {
  const next = { ...currentSettings(), ...patch };
  write(KEYS.adminSettings, next);
  return delay(ok(next), 150);
}
