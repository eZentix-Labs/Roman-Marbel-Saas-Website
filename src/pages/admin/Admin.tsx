import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { Callout, Icon, NumberField, Segmented, Sheet, Switch, TextField, Toast } from '@/components/ui';
import { useAdminAuth } from '@/state/AdminAuth';
import {
  ADMIN_DEMO, adminLogin, allProducts, bulkRateChange, createProduct, currentSettings,
  listEnquiries, patchEnquiry, patchProduct, saveSettings,
} from '@/api/client';
import { CATEGORIES } from '@/api/mock/categories';
import { imageUrl } from '@/lib/texture';
import {
  BAND_LABEL, maskPhone, prettyPhone, relativeDays, rupees, STOCK_LABEL, timeAgo,
} from '@/lib/format';
import type {
  BudgetBand, Enquiry, EnquiryStatus, Material, Product, Settings, StockStatus,
} from '@/types';

/**
 * PRD §8.1 — this is a phone-first tool for a shopkeeper, not a dashboard for an
 * analyst. Every screen is designed for one thumb, standing at a counter,
 * possibly with dusty hands.
 *
 * PRD R1/T5 call a stale catalogue the project's fatal risk: if adding a product
 * takes more than two minutes or needs a laptop, the catalogue rots and the
 * investment is lost. So: a 4-field add flow, inline rate editing that is one
 * tap and one keystroke, and stock toggles that are a single tap each.
 */

/* ── Shell ───────────────────────────────────────────────────────────────── */

function AdminShell({
  title, children, action, back,
}: { title: string; children: React.ReactNode; action?: React.ReactNode; back?: string }) {
  const { session, signOut } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-deep text-hi">
        <div className="flex items-center gap-2 px-4 py-3">
          {back ? (
            <button
              onClick={() => navigate(back)}
              aria-label="Back"
              className="-ml-2 grid h-11 w-11 place-items-center rounded-pill active:bg-surface/10"
            >
              <Icon name="arrowLeft" />
            </button>
          ) : (
            <span className="font-display text-h3">Shop admin</span>
          )}
          {back && <h1 className="min-w-0 flex-1 truncate font-display text-h3">{title}</h1>}
          <div className="ml-auto flex items-center gap-1">
            {action}
            <button
              onClick={() => { signOut(); navigate('/admin'); }}
              aria-label="Sign out"
              className="grid h-11 w-11 place-items-center rounded-pill active:bg-surface/10"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
        {!back && (
          <p className="px-4 pb-3 text-micro text-hi/60">
            Signed in as {session?.name} · {session?.role}
          </p>
        )}
      </header>

      <main className="px-4 py-4" style={{ paddingBottom: 'calc(84px + var(--sab))' }}>
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app border-t border-line bg-ink"
        style={{ paddingBottom: 'var(--sab)' }}
      >
        <ul className="grid grid-cols-4">
          {[
            { to: '/admin/home', icon: 'home', label: 'Today' },
            { to: '/admin/products', icon: 'grid', label: 'Catalogue' },
            { to: '/admin/enquiries', icon: 'inbox', label: 'Enquiries' },
            { to: '/admin/settings', icon: 'settings', label: 'Settings' },
          ].map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  'flex flex-col items-center gap-1 py-2 text-micro ' +
                  (isActive ? 'text-accent' : 'text-muted')
                }
              >
                <Icon name={tab.icon} size={22} />
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/* ── Login ───────────────────────────────────────────────────────────────── */

export function AdminLogin() {
  const { session, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (session) navigate('/admin/home', { replace: true }); }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await adminLogin(phone.replace(/\D/g, ''), password);
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    signIn({ name: r.data!.name, role: r.data!.role as 'owner', at: new Date().toISOString() });
    navigate('/admin/home', { replace: true });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6">
      <Link to="/" className="mb-8 text-small text-muted">← Back to the shop site</Link>
      <h1 className="font-display text-h1">Shop admin</h1>
      <p className="mt-2 text-small text-muted">
        Rates, stock and today's enquiries.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <TextField
          label="Phone" value={phone} onChange={setPhone}
          inputMode="tel" autoComplete="username" placeholder="7383695415"
        />
        <TextField
          label="Password" value={password} onChange={setPassword}
          type="password" autoComplete="current-password"
          error={err || undefined}
        />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6">
        <Callout tone="warning" title="Demo build">
          There is no real authentication in a frontend-only build. Use{' '}
          <strong>{ADMIN_DEMO.phone}</strong> / <strong>{ADMIN_DEMO.password}</strong>.
          Production uses argon2 against admin_user with an HttpOnly session
          cookie (TRD §8.2).
        </Callout>
      </div>
    </div>
  );
}

/* ── Today ───────────────────────────────────────────────────────────────── */

export function AdminHome() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const products = allProducts();

  useEffect(() => { setEnquiries(listEnquiries()); }, []);

  const newCount = enquiries.filter((e) => e.status === 'new').length;
  const today = enquiries.filter(
    (e) => new Date(e.createdAt).toDateString() === new Date().toDateString(),
  ).length;

  // PRD G4/R1 — catalogue freshness is on the admin home precisely because it
  // is the metric that predicts whether this project is still alive in a year.
  const fresh = products.filter(
    (p) => Date.now() - new Date(p.rateUpdatedAt).getTime() < 60 * 86400000,
  ).length;
  const freshPct = products.length ? Math.round((fresh / products.length) * 100) : 0;
  const stale = products
    .filter((p) => Date.now() - new Date(p.rateUpdatedAt).getTime() >= 60 * 86400000)
    .slice(0, 5);
  const outOfStock = products.filter((p) => p.stockStatus === 'out');

  return (
    <AdminShell title="Today">
      <div className="grid grid-cols-2 gap-3">
        <Tile figure={String(newCount)} label="New enquiries" to="/admin/enquiries" accent={newCount > 0} />
        <Tile figure={String(today)} label="Came in today" to="/admin/enquiries" />
        <Tile figure={freshPct + '%'} label="Rates updated in 60 days" to="/admin/products" warn={freshPct < 90} />
        <Tile figure={String(outOfStock.length)} label="Out of stock" to="/admin/products" />
      </div>

      {freshPct < 90 && (
        <div className="mt-4">
          <Callout tone="warning" title="Some rates are going stale">
            Target is above 90%. A catalogue with old rates is worse than no
            catalogue — the estimate stops matching the bill and every future
            estimate loses its credibility.
          </Callout>
        </div>
      )}

      {stale.length > 0 && (
        <section className="mt-6">
          <h2 className="eyebrow mb-2">Oldest rates — tap to fix</h2>
          <div className="card divide-y divide-line">
            {stale.map((p) => (
              <Link
                key={p.id}
                to={'/admin/products/' + p.id}
                className="flex items-center gap-3 px-3 py-2.5 active:bg-raised"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-medium">{p.nameEn}</p>
                  <p className="text-micro text-muted">
                    Updated {relativeDays(p.rateUpdatedAt)}
                  </p>
                </div>
                <span className="shrink-0 font-display text-small">₹{p.ratePerSqft}</span>
                <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="eyebrow mb-2">Latest enquiries</h2>
        {enquiries.length === 0 ? (
          <p className="card p-4 text-small text-muted">
            Nothing yet. Enquiries sent from the customer site land here — try
            sending one from the public site to see the whole loop.
          </p>
        ) : (
          <div className="card divide-y divide-line">
            {enquiries.slice(0, 5).map((e) => <EnquiryRow key={e.id} e={e} />)}
          </div>
        )}
      </section>

      <Link to="/admin/products/new" className="btn-primary mt-6 w-full">
        <Icon name="plus" size={18} /> Add a product
      </Link>

      <Link to="/admin/reports" className="btn-secondary mt-2 w-full">
        <Icon name="chart" size={18} /> This week
      </Link>
    </AdminShell>
  );
}

function Tile({
  figure, label, to, accent, warn,
}: { figure: string; label: string; to: string; accent?: boolean; warn?: boolean }) {
  return (
    <Link
      to={to}
      className={
        'rounded border p-4 ' +
        (accent ? 'border-accent bg-accent/5'
          : warn ? 'border-[#e8d6a8] bg-[#fdf6e7]'
          : 'border-line bg-surface')
      }
    >
      <p className="font-display text-figure leading-none">{figure}</p>
      <p className="mt-2 text-micro leading-snug text-muted">{label}</p>
    </Link>
  );
}

/* ── Catalogue list, with inline rate edit (A-1.3) ───────────────────────── */

export function AdminProducts() {
  const [rows, setRows] = useState<Product[]>(allProducts());
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? rows.filter((p) => (p.nameEn + ' ' + p.sku + ' ' + p.sizeMm).toLowerCase().includes(t))
      : rows;
  }, [rows, q]);

  async function commitRate(p: Product) {
    const next = parseFloat(draft);
    setEditing(null);
    if (!Number.isFinite(next) || next <= 0 || next === p.ratePerSqft) return;
    // A-1.3 / TRD §5.4 — one field, one call, not a full-object PUT.
    await patchProduct(p.id, { ratePerSqft: next, rateUpdatedAt: new Date().toISOString() });
    setRows(allProducts());
    setToast(p.nameEn + ' → ₹' + next);
  }

  async function cycleStock(p: Product) {
    const order: StockStatus[] = ['in', 'low', 'out', 'on_order'];
    const next = order[(order.indexOf(p.stockStatus) + 1) % order.length];
    await patchProduct(p.id, { stockStatus: next });
    setRows(allProducts());
  }

  return (
    <AdminShell title="Catalogue">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, SKU or size"
          className="field flex-1"
          aria-label="Search catalogue"
        />
        <Link to="/admin/products/new" aria-label="Add product" className="btn-primary shrink-0 px-4">
          <Icon name="plus" size={20} />
        </Link>
      </div>

      <button onClick={() => setBulkOpen(true)} className="btn-secondary mt-2 w-full text-small">
        Change a whole category by % (A-1.6)
      </button>

      <p className="mt-4 text-micro text-muted">
        Tap the rate to edit it. Tap the stock dot to cycle in → low → out → on order.
      </p>

      <div className="card mt-2 divide-y divide-line">
        {filtered.map((p) => {
          const stock = STOCK_LABEL[p.stockStatus];
          const staleRate = Date.now() - new Date(p.rateUpdatedAt).getTime() >= 60 * 86400000;
          return (
            <div key={p.id} className="flex items-center gap-2.5 px-3 py-2.5">
              <Link to={'/admin/products/' + p.id} className="shrink-0">
                <img
                  src={imageUrl({
                    seed: p.images[0].cdnPublicId, material: p.material,
                    hex: p.colourHexPrimary, type: 'flat', sizeMm: p.sizeMm,
                  }, 'thumb')}
                  alt="" width={44} height={44}
                  loading="lazy" className="h-11 w-11 rounded-sm object-cover"
                />
              </Link>

              <Link to={'/admin/products/' + p.id} className="min-w-0 flex-1">
                <p className="truncate text-small font-medium">{p.nameEn}</p>
                <p className="text-micro text-muted">
                  {p.sizeMm}
                  {!p.isPublished && <span className="ml-1 text-danger">· hidden</span>}
                  {staleRate && <span className="ml-1 text-warning">· rate {relativeDays(p.rateUpdatedAt)}</span>}
                </p>
              </Link>

              {editing === p.id ? (
                <input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitRate(p)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRate(p); if (e.key === 'Escape') setEditing(null); }}
                  aria-label={'Rate for ' + p.nameEn}
                  className="w-20 shrink-0 rounded-sm border border-accent px-2 py-1.5 text-right font-display"
                />
              ) : (
                <button
                  onClick={() => { setEditing(p.id); setDraft(String(p.ratePerSqft)); }}
                  aria-label={'Edit rate for ' + p.nameEn}
                  className="shrink-0 rounded-sm px-2 py-1.5 text-right font-display text-small active:bg-raised"
                >
                  ₹{p.ratePerSqft}
                </button>
              )}

              <button
                onClick={() => cycleStock(p)}
                aria-label={'Stock: ' + stock.en + '. Tap to change.'}
                title={stock.en}
                className="grid h-11 w-9 shrink-0 place-items-center"
                style={{ minWidth: 36 }}
              >
                <span className={'h-3.5 w-3.5 rounded-pill bg-current ' + stock.tone} />
              </button>
            </div>
          );
        })}
      </div>

      <Sheet open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk rate change">
        <BulkRate onDone={(msg) => { setRows(allProducts()); setBulkOpen(false); setToast(msg); }} />
      </Sheet>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </AdminShell>
  );
}

function BulkRate({ onDone }: { onDone: (msg: string) => void }) {
  const [cat, setCat] = useState(CATEGORIES[0].id);
  const [pct, setPct] = useState('5');
  const [busy, setBusy] = useState(false);

  return (
    <>
      <p className="text-small leading-relaxed text-muted">
        When a supplier revises rates they usually move together. This changes every
        product in a category at once.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="cat" className="mb-1 block text-small font-medium text-muted">Category</label>
          <select id="cat" value={cat} onChange={(e) => setCat(e.target.value)} className="field">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
          </select>
        </div>
        <NumberField label="Change by" suffix="%" value={pct} onChange={setPct} step={0.5} hint="Use a negative number to reduce." />
        <button
          onClick={async () => {
            setBusy(true);
            const r = await bulkRateChange(cat, parseFloat(pct) || 0);
            setBusy(false);
            onDone((r.data?.updated ?? 0) + ' products updated');
          }}
          disabled={busy}
          className="btn-primary w-full"
        >
          {busy ? 'Updating…' : 'Apply to the category'}
        </button>
      </div>
    </>
  );
}

/* ── Add / edit product (A-1.1) ──────────────────────────────────────────── */

export function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const existing = isNew ? null : allProducts().find((p) => p.id === id) ?? null;

  const [name, setName] = useState(existing?.nameEn ?? '');
  const [category, setCategory] = useState(existing?.categoryId ?? CATEGORIES[2].id);
  const [size, setSize] = useState(existing?.sizeMm ?? '600x600');
  const [rate, setRate] = useState(String(existing?.ratePerSqft ?? ''));
  const [material, setMaterial] = useState<Material>(existing?.material ?? 'vitrified');
  const [band, setBand] = useState<BudgetBand>(existing?.budgetBand ?? 'value');
  const [stock, setStock] = useState<StockStatus>(existing?.stockStatus ?? 'in');
  const [published, setPublished] = useState(existing?.isPublished ?? true);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const canSave = name.trim() && parseFloat(rate) > 0;

  async function save() {
    setBusy(true);
    if (existing) {
      await patchProduct(existing.id, {
        nameEn: name, categoryId: category, sizeMm: size,
        ratePerSqft: parseFloat(rate), material, budgetBand: band,
        stockStatus: stock, isPublished: published,
        rateUpdatedAt: parseFloat(rate) !== existing.ratePerSqft
          ? new Date().toISOString() : existing.rateUpdatedAt,
      });
    } else {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const pid = 'p-custom-' + slug + '-' + Date.now().toString(36);
      const BOX: Record<string, { p: number; s: number }> = {
        '600x600': { p: 4, s: 15.5 }, '800x800': { p: 3, s: 20.67 },
        '600x1200': { p: 2, s: 15.5 }, '300x300': { p: 11, s: 10.66 },
        '300x600': { p: 6, s: 11.63 }, '400x400': { p: 6, s: 10.33 },
      };
      const box = BOX[size];
      await createProduct({
        id: pid, sku: 'RM-' + pid.slice(-6).toUpperCase(),
        nameEn: name, nameBn: name, slug: slug + '-' + pid.slice(-4),
        categoryId: category, material, sizeMm: size, finish: 'matt',
        colourFamily: ['multi'], colourHexPrimary: '#cfc7bb',
        pricingUnit: size === 'Slab' ? 'slab' : 'box',
        ratePerSqft: parseFloat(rate), mrpPerSqft: null,
        piecesPerBox: box?.p ?? null, sqftPerBox: box?.s ?? null,
        weightPerSqft: 2.0, stockStatus: stock, budgetBand: band,
        application: ['floor'], isPublished: published, isFeatured: false,
        shadeVariationNote: material === 'marble' || material === 'granite'
          ? 'Natural raised — shade may vary by batch.' : null,
        rateUpdatedAt: new Date().toISOString(),
        images: (['flat', 'context', 'scale'] as const).map((type, n) => ({
          id: pid + '-' + n, cdnPublicId: 'roman-marbel/' + slug + '/' + type,
          type, sortOrder: n, altEn: name, altBn: name,
        })),
        variants: [],
      });
    }
    setBusy(false);
    navigate('/admin/products');
  }

  return (
    <AdminShell title={isNew ? 'Add a product' : 'Edit product'} back="/admin/products">
      {/* TRD §7.4 — three enforced photo slots, so an incomplete product is
          visibly incomplete in admin before it can be published. */}
      <section>
        <h2 className="eyebrow mb-2">Photos</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { type: 'flat' as const, label: 'Close-up' },
            { type: 'context' as const, label: 'Laid floor' },
            { type: 'scale' as const, label: 'Edge' },
          ].map((slot) => {
            const has = existing?.images.find((i) => i.type === slot.type);
            return (
              <button
                key={slot.type}
                onClick={() => setToast('Camera upload needs the CDN — see TRD §7.1')}
                className="overflow-hidden rounded-sm border border-dashed border-line bg-surface"
              >
                <div className="grid aspect-square place-items-center bg-raised/60">
                  {has && existing ? (
                    <img
                      src={imageUrl({
                        seed: has.cdnPublicId, material: existing.material,
                        hex: existing.colourHexPrimary, type: slot.type, sizeMm: existing.sizeMm,
                      }, 'thumb')}
                      alt="" width={100} height={100} className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon name="camera" className="text-muted" />
                  )}
                </div>
                <p className="py-1.5 text-center text-micro text-muted">{slot.label}</p>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-micro leading-relaxed text-muted">
          All three, same light, no filters. An inconsistent catalogue reads as
          untrustworthy however good each photo is.
        </p>
      </section>

      {/* A-1.1 — name, category, size, rate. Everything else optional. */}
      <section className="mt-6 space-y-4">
        <TextField label="Name" value={name} onChange={setName} placeholder="Carrara White Vitrified" autoFocus={isNew} />

        <div>
          <label htmlFor="pcat" className="mb-1 block text-small font-medium text-muted">Category</label>
          <select id="pcat" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="psize" className="mb-1 block text-small font-medium text-muted">Size</label>
          <select id="psize" value={size} onChange={(e) => setSize(e.target.value)} className="field">
            {['600x600', '800x800', '600x1200', '300x300', '300x600', '400x400', '600x900', 'Slab']
              .map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <NumberField label="Rate per sq ft" suffix="₹" value={rate} onChange={setRate} placeholder="52" />

        <div>
          <p className="mb-2 text-small font-medium text-muted">Stock</p>
          <div className="flex flex-wrap gap-2">
            {(['in', 'low', 'out', 'on_order'] as StockStatus[]).map((s) => (
              <button key={s} onClick={() => setStock(s)} className={'chip ' + (stock === s ? 'chip-on' : '')}>
                {STOCK_LABEL[s].en}
              </button>
            ))}
          </div>
        </div>
      </section>

      <button
        onClick={() => setMore((m) => !m)}
        aria-expanded={more}
        className="mt-5 flex w-full items-center justify-between border-y border-line py-3 text-small font-medium"
      >
        Everything else (optional)
        <Icon name="chevron" size={16} className={more ? 'rotate-180' : ''} />
      </button>

      {more && (
        <section className="space-y-4 py-4">
          <div>
            <p className="mb-2 text-small font-medium text-muted">Material</p>
            <div className="flex flex-wrap gap-2">
              {(['marble', 'granite', 'vitrified', 'ceramic', 'other'] as Material[]).map((m) => (
                <button key={m} onClick={() => setMaterial(m)} className={'chip ' + (material === m ? 'chip-on' : '')}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-small font-medium text-muted">Budget band</p>
            <div className="flex gap-2">
              {(['economy', 'value', 'premium'] as BudgetBand[]).map((b) => (
                <button key={b} onClick={() => setBand(b)} className={'chip ' + (band === b ? 'chip-on' : '')}>
                  {BAND_LABEL[b]}
                </button>
              ))}
            </div>
          </div>
          {/* A-1.5 — hide without deleting. Nothing is ever hard-deleted, because
              old estimates still reference it (TRD §4.1). */}
          <div className="list">
            <Switch
              label="Show on the site"
              hint="Hiding keeps the product and its history; it never deletes it."
              checked={published}
              onChange={setPublished}
            />
          </div>
        </section>
      )}

      <button onClick={save} disabled={!canSave || busy} className="btn-primary mt-6 w-full">
        {busy ? 'Saving…' : isNew ? 'Save and publish' : 'Save changes'}
      </button>

      {existing && (
        <Link to={'/product/' + existing.slug} className="btn-secondary mt-2 w-full">
          See it on the customer site
        </Link>
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </AdminShell>
  );
}

/* ── Enquiry inbox (A-2.x) ───────────────────────────────────────────────── */

const STATUSES: EnquiryStatus[] = ['new', 'contacted', 'quoted', 'visited', 'won', 'lost'];

function EnquiryRow({ e }: { e: Enquiry }) {
  return (
    <Link to={'/admin/enquiries/' + e.id} className="flex items-center gap-3 px-3 py-3 active:bg-raised">
      <span
        className={
          'grid h-9 w-9 shrink-0 place-items-center rounded-pill text-micro font-bold ' +
          (e.leadScore >= 60 ? 'bg-accent text-white'
            : e.leadScore >= 35 ? 'bg-raised text-hi'
            : 'bg-raised/60 text-muted')
        }
        title={'Lead score ' + e.leadScore}
      >
        {e.leadScore}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium">
          {e.name}
          {e.status === 'new' && <span className="ml-2 text-micro font-bold text-accent">NEW</span>}
        </p>
        <p className="truncate text-micro text-muted">
          {maskPhone(e.phone)} · {e.pinCode} · {e.quantitySummary}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {e.estimatedValue > 0 && (
          <p className="font-display text-small font-semibold">{rupees(e.estimatedValue)}</p>
        )}
        <p className="text-micro text-muted">{timeAgo(e.createdAt)}</p>
      </div>
    </Link>
  );
}

export function AdminEnquiries() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  useEffect(() => { setRows(listEnquiries()); }, []);

  const shown = useMemo(() => {
    const list = filter === 'open'
      ? rows.filter((e) => !['won', 'lost'].includes(e.status))
      : rows;
    // Highest-value leads first — the whole point of scoring (PRD §12.2).
    return [...list].sort((a, b) => b.leadScore - a.leadScore);
  }, [rows, filter]);

  return (
    <AdminShell title="Enquiries">
      <Segmented
        ariaLabel="Filter"
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'open' as const, label: 'Open' },
          { id: 'all' as const, label: 'All (' + rows.length + ')' },
        ]}
      />

      <p className="mt-3 text-micro text-muted">
        Sorted by lead score — the number on the left. Call the big ones first.
      </p>

      {shown.length === 0 ? (
        <Callout tone="neutral">
          Nothing here yet. Send an enquiry from the customer site and it appears
          in this inbox — the inbox, not WhatsApp, is the source of truth for
          whether a lead arrived.
        </Callout>
      ) : (
        <div className="card mt-2 divide-y divide-line">
          {shown.map((e) => <EnquiryRow key={e.id} e={e} />)}
        </div>
      )}
    </AdminShell>
  );
}

export function AdminEnquiryDetail() {
  const { id } = useParams();
  const [e, setE] = useState<Enquiry | null>(null);
  const [note, setNote] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { setE(listEnquiries().find((x) => x.id === id) ?? null); }, [id]);

  if (!e) {
    return (
      <AdminShell title="Enquiry" back="/admin/enquiries">
        <p className="text-small text-muted">Not found.</p>
      </AdminShell>
    );
  }

  async function setStatus(status: EnquiryStatus) {
    const patch: Partial<Enquiry> = { status, lastContactedAt: new Date().toISOString() };
    if (status !== 'lost') patch.lostReason = null;
    const r = await patchEnquiry(e!.id, patch);
    if (r.data) setE(r.data);
  }

  async function addNote() {
    if (!note.trim()) return;
    const r = await patchEnquiry(e!.id, { notes: [...e!.notes, note.trim()] });
    if (r.data) { setE(r.data); setNote(''); setToast('Note saved'); }
  }

  const wa = 'https://wa.me/91' + e.phone + '?text=' + encodeURIComponent(
    'Hello ' + e.name + ', this is Roman Marbel about your enquiry' +
    (e.estimateRef ? ' ' + e.estimateRef : '') + '.',
  );

  return (
    <AdminShell title={e.name} back="/admin/enquiries">
      {/* A-2.2 — one-tap call and one-tap WhatsApp, the two things the owner
          actually does with an enquiry. */}
      <div className="grid grid-cols-2 gap-2">
        <a href={'tel:+91' + e.phone} className="btn-primary">
          <Icon name="phone" size={18} /> Call
        </a>
        <a href={wa} target="_blank" rel="noreferrer" className="btn-secondary">WhatsApp</a>
      </div>

      <div className="card mt-4 divide-y divide-line px-4 text-small">
        <KV k="Phone" v={prettyPhone(e.phone) + (e.phoneVerified ? ' ✓ verified' : '')} />
        <KV k="PIN" v={e.pinCode + (e.zoneName ? ' · ' + e.zoneName : ' · outside delivery map')} />
        <KV k="Product" v={e.productSummary} />
        <KV k="Quantity" v={e.quantitySummary} />
        {e.estimatedValue > 0 && <KV k="Estimated value" v={rupees(e.estimatedValue)} />}
        {e.estimateRef && <KV k="Estimate" v={e.estimateRef} />}
        <KV k="Type" v={e.type} />
        <KV k="Best time" v={e.preferredContactTime} />
        <KV k="Lead score" v={String(e.leadScore) + ' / 100'} />
        <KV k="Received" v={timeAgo(e.createdAt)} />
      </div>

      {e.message && (
        <div className="mt-4">
          <h2 className="eyebrow mb-2">What they wrote</h2>
          <p className="card p-4 text-small leading-relaxed">{e.message}</p>
        </div>
      )}

      {/* A-2.3 — status pipeline with a lost-reason picker */}
      <section className="mt-6">
        <h2 className="eyebrow mb-2">Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={'chip ' + (e.status === s ? 'chip-on' : '')}
            >
              {s}
            </button>
          ))}
        </div>

        {e.status === 'lost' && (
          <div className="mt-3">
            <label htmlFor="lost" className="mb-1 block text-small font-medium text-muted">
              Why was it lost?
            </label>
            <select
              id="lost"
              value={e.lostReason ?? lostReason}
              onChange={async (ev) => {
                setLostReason(ev.target.value);
                const r = await patchEnquiry(e.id, { lostReason: ev.target.value });
                if (r.data) setE(r.data);
              }}
              className="field"
            >
              <option value="">Pick a reason</option>
              {['Rate too high', 'Bought elsewhere', 'Delivery too costly',
                'Out of stock', 'Postponed the work', 'Not reachable', 'Other']
                .map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <p className="mt-1.5 text-micro text-muted">
              Worth recording honestly — "rate too high" appearing on every lost
              lead in one category is the most useful thing in this whole panel.
            </p>
          </div>
        )}
      </section>

      {/* A-2.4 — notes */}
      <section className="mt-6">
        <h2 className="eyebrow mb-2">Notes</h2>
        {e.notes.length > 0 && (
          <ul className="card mb-2 divide-y divide-line text-small">
            {e.notes.map((n, i) => <li key={i} className="px-3 py-2.5">{n}</li>)}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
            onKeyDown={(ev) => { if (ev.key === 'Enter') addNote(); }}
            placeholder="Said he will come Saturday"
            className="field flex-1"
            aria-label="Add a note"
          />
          <button onClick={addNote} className="btn-primary shrink-0 px-4">
            <Icon name="plus" size={18} />
          </button>
        </div>
      </section>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </AdminShell>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

/* ── Weekly report (PRD §8.6) ────────────────────────────────────────────── */

export function AdminReports() {
  const enquiries = listEnquiries();
  const products = allProducts();

  const byZone = enquiries.reduce<Record<string, number>>((acc, e) => {
    const k = e.zoneName ?? 'Outside the map';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const won = enquiries.filter((e) => e.status === 'won').length;
  const conversion = enquiries.length ? Math.round((won / enquiries.length) * 100) : 0;

  return (
    <AdminShell title="This week" back="/admin/home">
      <div className="grid grid-cols-2 gap-3">
        <Tile figure={String(enquiries.length)} label="Enquiries" to="/admin/enquiries" />
        <Tile figure={conversion + '%'} label="Converted to won" to="/admin/enquiries" />
      </div>

      <section className="mt-6">
        <h2 className="eyebrow mb-2">By zone</h2>
        <div className="card divide-y divide-line text-small">
          {Object.entries(byZone).length === 0 ? (
            <p className="px-3 py-3 text-muted">No enquiries yet.</p>
          ) : (
            Object.entries(byZone).map(([z, n]) => (
              <div key={z} className="flex justify-between px-3 py-2.5">
                <span className="text-muted">{z}</span>
                <span className="font-medium">{n}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="eyebrow mb-2">Viewed but never enquired</h2>
        <Callout tone="neutral">
          PRD §8.6 calls this the most commercially useful report here: a product
          people look at and never ask about is either priced wrong or
          photographed badly, and both are fixable the same week.
          <p className="mt-2 text-micro">
            Needs real page-view data from GA4 or Plausible (TRD §9.5), so it stays
            empty in this frontend rather than showing invented numbers.
          </p>
        </Callout>
      </section>

      <section className="mt-6">
        <h2 className="eyebrow mb-2">Catalogue freshness</h2>
        <div className="card divide-y divide-line text-small">
          <div className="flex justify-between px-3 py-2.5">
            <span className="text-muted">Products published</span>
            <span className="font-medium">{products.filter((p) => p.isPublished).length}</span>
          </div>
          <div className="flex justify-between px-3 py-2.5">
            <span className="text-muted">Rate updated in 60 days</span>
            <span className="font-medium">
              {products.filter((p) => Date.now() - new Date(p.rateUpdatedAt).getTime() < 60 * 86400000).length}
            </span>
          </div>
          <div className="flex justify-between px-3 py-2.5">
            <span className="text-muted">Out of stock</span>
            <span className="font-medium">{products.filter((p) => p.stockStatus === 'out').length}</span>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

/* ── Settings (TRD §10.5 — every business constant, editable) ────────────── */

export function AdminSettings() {
  const [s, setS] = useState<Settings>(currentSettings());
  const [toast, setToast] = useState('');

  const num = (k: keyof Settings) => (v: string) =>
    setS((prev) => ({ ...prev, [k]: parseFloat(v) || 0 }));

  async function save() {
    await saveSettings(s);
    setToast('Saved');
  }

  return (
    <AdminShell title="Settings">
      <Callout tone="neutral" title="These drive every estimate">
        Change a number here and every future estimate uses it immediately. No
        developer, no deploy. Old estimates keep the rate they were given
        (TRD §4.1) so nobody is shown one price and billed another.
      </Callout>

      <section className="mt-5 space-y-4">
        <h2 className="eyebrow">Tax &amp; wastage</h2>
        <NumberField label="GST rate" suffix="%" value={String(s.gstRatePct)} onChange={num('gstRatePct')} hint="Confirm the current slab with the accountant (PRD Q2)." />
        <NumberField label="Default wastage" suffix="%" value={String(s.defaultWastagePct)} onChange={num('defaultWastagePct')} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Minimum wastage" suffix="%" value={String(s.minWastagePct)} onChange={num('minWastagePct')} />
          <NumberField label="Maximum wastage" suffix="%" value={String(s.maxWastagePct)} onChange={num('maxWastagePct')} />
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="eyebrow">Add-on rates</h2>
        <NumberField label="Skirting" suffix="₹/ft" value={String(s.skirtingRatePerFt)} onChange={num('skirtingRatePerFt')} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Adhesive bag" suffix="₹" value={String(s.adhesiveBagPrice)} onChange={num('adhesiveBagPrice')} />
          <NumberField label="Covers" suffix="sq ft" value={String(s.adhesiveCoverageSqftPerBag)} onChange={num('adhesiveCoverageSqftPerBag')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Grout" suffix="₹/kg" value={String(s.groutPricePerKg)} onChange={num('groutPricePerKg')} />
          <NumberField label="Per sq ft" suffix="kg" value={String(s.groutFactorKgPerSqft)} onChange={num('groutFactorKgPerSqft')} step={0.01} />
        </div>
        <NumberField label="Cutting charge" suffix="₹" value={String(s.cuttingChargeFlat)} onChange={num('cuttingChargeFlat')} />
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="eyebrow">Shop details</h2>
        <TextField label="Phone" value={s.ownerPhone} onChange={(v) => setS({ ...s, ownerPhone: v })} />
        <TextField label="WhatsApp (with country code)" value={s.ownerWhatsapp} onChange={(v) => setS({ ...s, ownerWhatsapp: v })} />
        <TextField label="Address" value={s.storeAddress} onChange={(v) => setS({ ...s, storeAddress: v })} />
        <TextField label="PIN" value={s.storePin} onChange={(v) => setS({ ...s, storePin: v })} />
        <TextField label="GSTIN" value={s.gstin} onChange={(v) => setS({ ...s, gstin: v })} />
        <TextField label="Hours" value={s.hours} onChange={(v) => setS({ ...s, hours: v })} />
        <TextField label="Rate validity line" value={s.rateValidityText} onChange={(v) => setS({ ...s, rateValidityText: v })} hint="Shown in the footer of every page." />
      </section>

      <button onClick={save} className="btn-primary mt-6 w-full">Save settings</button>

      <div className="mt-6">
        <Callout tone="warning" title="Still to decide (PRD §15.3)">
          Store PIN 713401 or 713407 · GST inclusive or exclusive · exact delivery
          charges per zone · breakage policy · return window · trade-rate
          eligibility. Each one is a business decision, not an engineering one.
        </Callout>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </AdminShell>
  );
}
