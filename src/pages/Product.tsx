import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TopBar, ContactPair, contactLinks } from '@/components/layout/AppShell';
import { PhotoViewer } from '@/components/catalogue/PhotoViewer';
import { ProductCard } from '@/components/catalogue/ProductCard';
import { Accordion, Callout, Icon, Sheet, TextField, Toast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import { getProduct, getSimilar, requestOtp, submitEnquiry, verifyOtp, DEMO_OTP } from '@/api/client';
import { imageUrl, TRANSFORMS } from '@/lib/texture';
import {
  BAND_LABEL, FINISH_LABEL, MATERIAL_LABEL, normalisePhone, rate as fmtRate,
  relativeDays, STOCK_LABEL,
} from '@/lib/format';
import { track } from '@/lib/analytics';
import type { Product as P, ProductVariant } from '@/types';

/**
 * PRD F-4.1 — this page fits one mobile screen with no page scrolling. The
 * layout is a flex column pinned to 100dvh: the photo takes whatever height is
 * left, and the identity block plus the single CTA are fixed at the bottom.
 *
 * Everything else — full spec, care, application, technical raised data, similar
 * products — lives behind a sheet (F-4.3). That is a constraint on how much this
 * page may claim, and it is what forces the right discipline: photo, name, rate,
 * size, stock, one CTA.
 */
export default function Product() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { t, pick, lang } = useI18n();
  const { noteView, toggleCompare, compare } = useApp();

  const [product, setProduct] = useState<P | null>(null);
  const [similar, setSimilar] = useState<P[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [shot, setShot] = useState(0);
  const [viewerAt, setViewerAt] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<string | undefined>();
  const [sheet, setSheet] = useState<'none' | 'details' | 'similar' | 'restock' | 'sample'>('none');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let live = true;
    setProduct(null); setNotFound(false); setShot(0); setVariantId(undefined);
    getProduct(slug).then((r) => {
      if (!live) return;
      if (r.data) {
        setProduct(r.data);
        noteView(r.data.id);
        track('product_view', { slug: r.data.slug, rate: r.data.ratePerSqft });
        const firstInStock = r.data.variants.find((v) => v.stockStatus !== 'out');
        setVariantId(firstInStock?.id ?? r.data.variants[0]?.id);
      } else setNotFound(true);
    });
    getSimilar(slug).then((r) => live && setSimilar(r.data ?? []));
    return () => { live = false; };
  }, [slug, noteView]);

  const variant = useMemo<ProductVariant | undefined>(
    () => product?.variants.find((v) => v.id === variantId),
    [product, variantId],
  );

  if (notFound) {
    return (
      <>
        <TopBar back title="Not found" />
        <main className="px-4 py-16 text-center">
          <p className="font-display text-h2">We do not have that one listed.</p>
          <Link to="/catalogue" className="btn-primary mt-6 inline-flex">Back to the catalogue</Link>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <TopBar back />
        <div className="flex h-[100dvh] flex-col px-4">
          <div className="skeleton mt-2 min-h-0 flex-1 rounded" />
          <div className="space-y-2 py-4">
            <div className="skeleton h-6 w-3/5" /><div className="skeleton h-4 w-2/5" />
            <div className="skeleton h-12 w-full rounded-pill" />
          </div>
        </div>
      </>
    );
  }

  // Rate and stock follow the selected variant when there is one (F-8.1/F-8.4).
  const effectiveRate = variant?.retailRatePerSqft ?? product.ratePerSqft;
  const effectiveStock = variant?.stockStatus ?? product.stockStatus;
  const stock = STOCK_LABEL[effectiveStock];
  const isOut = effectiveStock === 'out';
  const image = product.images[shot];

  const waText =
    'Hello Roman Marbel, I am looking at ' + product.nameEn +
    ' (' + product.sizeMm + ', ' + fmtRate(effectiveRate) + ').' +
    (variant ? ' Variant: ' + (variant.thicknessMm ? variant.thicknessMm + 'mm ' : '') + FINISH_LABEL[variant.finish] + '.' : '') +
    ' Is it available?';

  // Thickness × finish matrix. F-8.2: a finish not offered at a thickness is
  // visibly disabled, never hidden — hiding it makes the range look smaller
  // than it is and invites the same phone call the app exists to remove.
  const thicknesses = [...new Set(product.variants.map((v) => v.thicknessMm))].filter(Boolean) as number[];
  const finishes = [...new Set(product.variants.map((v) => v.finish))];
  const selectedThickness = variant?.thicknessMm ?? thicknesses[0];

  return (
    <>
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <TopBar
          back
          title={pick(product.nameEn, product.nameBn)}
          subtitle={product.sku}
          right={
            <button
              onClick={() => toggleCompare(product.id)}
              aria-pressed={compare.includes(product.id)}
              aria-label={t('compare')}
              className={
                'grid h-11 w-11 place-items-center rounded-pill active:bg-raised ' +
                (compare.includes(product.id) ? 'text-accent' : 'text-muted')
              }
            >
              <Icon name="layers" />
            </button>
          }
        />

        {/* Photo — takes all remaining height, tappable to full-screen zoom */}
        <div className="relative min-h-0 flex-1 bg-raised">
          <button
            onClick={() => setViewerAt(shot)}
            aria-label="Open full-screen photo viewer"
            className="absolute inset-0 h-full w-full"
            style={{ minHeight: 0 }}
          >
            <img
              src={imageUrl({
                seed: image.cdnPublicId, material: product.material,
                hex: product.colourHexPrimary, type: image.type, sizeMm: product.sizeMm,
              }, 'hero')}
              alt={pick(image.altEn, image.altBn)}
              width={TRANSFORMS.hero.w}
              height={TRANSFORMS.hero.h}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </button>

          <span className="pointer-events-none absolute left-3 top-3 rounded-pill bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-[2px]">
            {BAND_LABEL[product.budgetBand]}
          </span>

          <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-pill bg-black/45 text-white backdrop-blur-[2px]">
            <Icon name="zoom" size={18} />
          </span>

          {/* Shot switcher — flat / context / scale (F-1.3) */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setShot(i)}
                aria-label={img.type}
                aria-current={i === shot}
                className={
                  'h-2 rounded-pill transition-all ' +
                  (i === shot ? 'w-6 bg-surface' : 'w-2 bg-surface/55')
                }
                style={{ minHeight: 8, minWidth: 8 }}
              />
            ))}
          </div>

          {product.shadeVariationNote && (
            <p className="pointer-events-none absolute inset-x-0 bottom-8 mx-3 rounded-sm bg-black/70 px-3 py-1.5 text-center text-[11px] leading-snug text-hi">
              {t('shadeVaries')}
            </p>
          )}
        </div>

        {/* Identity block + one CTA, fixed at the bottom */}
        <div className="shrink-0 px-4 pt-3" style={{ paddingBottom: 'calc(12px + var(--sab))' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-display text-h2 leading-tight">
                {pick(product.nameEn, product.nameBn)}
              </h1>
              <p className="mt-0.5 truncate text-small text-muted">
                {product.sizeMm} · {MATERIAL_LABEL[product.material]} ·{' '}
                {FINISH_LABEL[variant?.finish ?? product.finish]}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-h2 leading-tight">₹{effectiveRate}</p>
              <p className="text-micro text-muted">per sq ft</p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span className={'flex items-center gap-1 text-small font-medium ' + stock.tone}>
              <span className="h-2 w-2 rounded-pill bg-current" aria-hidden />
              {lang === 'bn' ? stock.bn : stock.en}
            </span>
            {variant?.lotNote && (
              <span className="truncate text-micro text-muted">{variant.lotNote}</span>
            )}
            <button
              onClick={() => setSheet('details')}
              className="ml-auto shrink-0 text-small font-semibold text-accent"
              style={{ minHeight: 32 }}
            >
              {t('details')}
            </button>
          </div>

          {/* Variant picker (F-8.1/F-8.2) */}
          {product.variants.length > 0 && (
            <div className="mt-3 space-y-2">
              {thicknesses.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-micro text-muted">{t('thickness')}</span>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {thicknesses.map((th) => {
                      const target = product.variants.find(
                        (v) => v.thicknessMm === th && v.finish === variant?.finish,
                      ) ?? product.variants.find((v) => v.thicknessMm === th)!;
                      return (
                        <button
                          key={th}
                          onClick={() => setVariantId(target.id)}
                          className={
                            'shrink-0 rounded-pill border px-3 text-small ' +
                            (selectedThickness === th
                              ? 'border-accent bg-accent text-white'
                              : 'border-line bg-surface')
                          }
                          style={{ minHeight: 36 }}
                        >
                          {th} mm
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-micro text-muted">{t('finish')}</span>
                <div className="flex gap-1.5 overflow-x-auto">
                  {finishes.map((f) => {
                    const match = product.variants.find(
                      (v) => v.finish === f && v.thicknessMm === selectedThickness,
                    );
                    const disabled = !match;
                    return (
                      <button
                        key={f}
                        disabled={disabled}
                        onClick={() => match && setVariantId(match.id)}
                        aria-disabled={disabled}
                        title={disabled ? 'Not made in ' + selectedThickness + ' mm' : undefined}
                        className={
                          'relative shrink-0 rounded-pill border px-3 text-small transition-opacity ' +
                          (disabled
                            ? 'cursor-not-allowed border-line bg-raised/60 text-muted/50 line-through'
                            : variant?.finish === f
                              ? 'border-accent bg-accent text-white'
                              : 'border-line bg-surface')
                        }
                        style={{ minHeight: 36 }}
                      >
                        {FINISH_LABEL[f]}
                        {match && match.stockStatus === 'out' && !disabled && (
                          <span className="ml-1 text-[10px] opacity-70">·0</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* The one primary action. F-4.4 — "Calculate for my room", not
              "Add to cart". When the selected variant is out of stock the
              calculator is replaced by a restock lead capture (F-8.5). */}
          <div className="mt-3">
            {isOut ? (
              <button onClick={() => setSheet('restock')} className="btn-primary w-full">
                {t('requestRestock')}
              </button>
            ) : (
              <button
                onClick={() =>
                  navigate('/estimate/new?product=' + product.slug + (variantId ? '&variant=' + variantId : ''))
                }
                className="btn-primary w-full"
              >
                {t('calculateForRoom')}
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <a
              href={contactLinks().wa(waText)}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('whatsapp_click', { source: 'product', slug: product.slug })}
              className="flex items-center gap-1.5 text-small font-semibold text-accent"
              style={{ minHeight: 40 }}
            >
              <Icon name="phone" size={16} /> Ask on WhatsApp
            </a>
            <button
              onClick={() => setSheet('sample')}
              className="text-small text-muted underline underline-offset-2"
              style={{ minHeight: 40 }}
            >
              {t('askSample')}
            </button>
          </div>
        </div>
      </div>

      {viewerAt !== null && (
        <PhotoViewer product={product} startIndex={viewerAt} onClose={() => setViewerAt(null)} />
      )}

      {/* ── Detail sheet (F-4.3) ─────────────────────────────────────────── */}
      <Sheet
        open={sheet === 'details'}
        onClose={() => setSheet('none')}
        title={pick(product.nameEn, product.nameBn)}
        footer={
          <button onClick={() => setSheet('similar')} className="btn-secondary w-full">
            {t('similar')}
          </button>
        }
      >
        <dl className="divide-y divide-line text-small">
          <Row k="Rate" v={fmtRate(effectiveRate)} />
          {product.mrpPerSqft && <Row k="MRP" v={fmtRate(product.mrpPerSqft)} />}
          <Row k={t('size')} v={product.sizeMm} />
          <Row k={t('material')} v={MATERIAL_LABEL[product.material]} />
          <Row k={t('finish')} v={FINISH_LABEL[variant?.finish ?? product.finish]} />
          {product.pricingUnit === 'box' ? (
            <>
              <Row k={t('piecesPerBox')} v={String(product.piecesPerBox)} />
              <Row k={t('sqftPerBox')} v={product.sqftPerBox + ' sq ft'} />
            </>
          ) : (
            <Row k="Sold by" v="Square foot (slab material — cut to size at the shop)" />
          )}
          <Row k="Weight" v={product.weightPerSqft + ' kg/sq ft'} />
          <Row k="Stock" v={lang === 'bn' ? stock.bn : stock.en} />
          <Row k="Rate updated" v={relativeDays(product.rateUpdatedAt)} />
        </dl>

        {/* Natural raised technical specs — F-8.7 */}
        {variant && (variant.waterAbsorptionPct != null || variant.quarryOrigin) && (
          <section className="mt-5">
            <h3 className="eyebrow mb-2">{t('technicalSpecs')}</h3>
            <dl className="divide-y divide-line text-small">
              {variant.waterAbsorptionPct != null &&
                <Row k={t('waterAbsorption')} v={variant.waterAbsorptionPct + '%'} />}
              {variant.compressiveStrengthMpa != null &&
                <Row k={t('compressiveStrength')} v={variant.compressiveStrengthMpa + ' MPa'} />}
              {variant.quarryOrigin && <Row k={t('quarryOrigin')} v={variant.quarryOrigin} />}
            </dl>
          </section>
        )}

        <div className="mt-5">
          <Accordion
            defaultOpen={0}
            items={[
              ...(product.applicationNote
                ? [{ id: 'app', title: t('application'), body: product.applicationNote }] : []),
              ...(product.careNote
                ? [{ id: 'care', title: t('care'), body: product.careNote }] : []),
              ...(product.shadeVariationNote
                ? [{ id: 'shade', title: t('shadeVaries'), body: product.shadeVariationNote }] : []),
              {
                id: 'where',
                title: 'Suitable for',
                body: product.application.map((a) => a.replace(/^\w/, (c) => c.toUpperCase())).join(' · '),
              },
            ]}
          />
        </div>
      </Sheet>

      {/* ── Similar strip (F-1.5) ────────────────────────────────────────── */}
      <Sheet open={sheet === 'similar'} onClose={() => setSheet('none')} title={t('similar')}>
        <p className="mb-3 text-small text-muted">
          Same look, different rate. Matched on colour and where it is used.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {similar.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </Sheet>

      {/* ── Restock lead capture (F-8.5) ─────────────────────────────────── */}
      <LeadSheet
        open={sheet === 'restock'}
        onClose={() => setSheet('none')}
        title={t('outOfStockTitle')}
        blurb={t('outOfStockBody')}
        type="restock"
        product={product}
        rate={effectiveRate}
        onDone={(msg) => { setSheet('none'); setToast(msg); }}
      />

      {/* ── Sample request (F-4.7) ───────────────────────────────────────── */}
      <LeadSheet
        open={sheet === 'sample'}
        onClose={() => setSheet('none')}
        title={t('askSample')}
        blurb="A photo on a phone is not the material. Ask for a piece to take home and look at in your own light."
        type="sample"
        product={product}
        rate={effectiveRate}
        onDone={(msg) => { setSheet('none'); setToast(msg); }}
      />

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

/**
 * Shared lead capture for restock and sample requests. Both are real enquiries
 * (TRD enquiry_type includes 'restock' and 'sample') and both go through OTP,
 * because F-6.2's junk-lead protection applies to every path that reaches the
 * owner's phone, not just the main enquiry form.
 */
function LeadSheet({
  open, onClose, title, blurb, type, product, rate, onDone,
}: {
  open: boolean; onClose: () => void; title: string; blurb: string;
  type: 'restock' | 'sample'; product: P; rate: number; onDone: (msg: string) => void;
}) {
  const { t } = useI18n();
  const { pin, setPin } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pinDraft, setPinDraft] = useState(pin);
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  async function sendCode() {
    const ten = normalisePhone(phone);
    if (!name.trim()) return setErr({ name: 'Please tell us your name.' });
    if (!ten) return setErr({ phone: 'Enter a 10-digit mobile number.' });
    setErr({}); setBusy(true);
    const r = await requestOtp(ten);
    setBusy(false);
    if (r.error) return setErr({ phone: r.error.message });
    setStage('otp');
  }

  async function confirm() {
    const ten = normalisePhone(phone)!;
    setBusy(true);
    const v = await verifyOtp(ten, code);
    if (v.error) { setBusy(false); return setErr({ code: v.error.message }); }
    setToken(v.data!.token);
    const r = await submitEnquiry({
      estimateRef: null, name, phone: ten, pinCode: pinDraft,
      preferredContactTime: 'Anytime',
      message: type === 'restock'
        ? 'Notify me when ' + product.nameEn + ' is back in stock.'
        : 'Sample piece requested: ' + product.nameEn + '.',
      type,
      estimatedValue: 0,
      productSummary: product.nameEn + ' (' + product.sizeMm + ')',
      quantitySummary: '—',
      sourcePage: 'product',
      verifiedPhoneToken: v.data!.token,
    });
    setBusy(false);
    if (r.data) {
      setPin(pinDraft);
      track(type === 'restock' ? 'restock_request' : 'sample_request', { slug: product.slug });
      onDone(type === 'restock' ? 'We will call you when it arrives.' : 'Sample request sent.');
      setStage('form'); setName(''); setPhone(''); setCode('');
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        stage === 'form' ? (
          <button onClick={sendCode} disabled={busy} className="btn-primary w-full">
            {busy ? t('loading') : t('sendOtp')}
          </button>
        ) : (
          <button onClick={confirm} disabled={busy || code.length !== 6} className="btn-primary w-full">
            {busy ? t('loading') : t('submitEnquiry')}
          </button>
        )
      }
    >
      <p className="mb-4 text-small leading-relaxed text-muted">{blurb}</p>
      <div className="mb-4 flex items-center gap-3 rounded-sm border border-line bg-surface p-3">
        <img
          src={imageUrl({
            seed: product.images[0].cdnPublicId, material: product.material,
            hex: product.colourHexPrimary, type: 'flat', sizeMm: product.sizeMm,
          }, 'thumb')}
          alt="" width={48} height={48} className="h-12 w-12 rounded-sm object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-small font-medium">{product.nameEn}</p>
          <p className="text-micro text-muted">{product.sizeMm} · {fmtRate(rate)}</p>
        </div>
      </div>

      {stage === 'form' ? (
        <div className="space-y-3">
          <TextField label={t('yourName')} value={name} onChange={setName} error={err.name} autoComplete="name" />
          <TextField
            label={t('phoneNumber')} value={phone} onChange={setPhone} error={err.phone}
            inputMode="tel" autoComplete="tel" placeholder="98xxxxxxxx"
          />
          <TextField
            label={t('pinCode')} value={pinDraft}
            onChange={(v) => setPinDraft(v.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric" placeholder="713407"
          />
          <p className="text-micro leading-relaxed text-muted">{t('consent')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <TextField
            label={t('enterOtp')} value={code}
            onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            error={err.code} inputMode="numeric" autoFocus
            hint={'Demo build — no SMS is sent. Use ' + DEMO_OTP + '.'}
          />
          <button onClick={() => setStage('form')} className="text-small text-accent underline">
            Change number
          </button>
        </div>
      )}
    </Sheet>
  );
}
