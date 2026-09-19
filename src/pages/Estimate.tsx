import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TopBar, Footer, contactLinks } from '@/components/layout/AppShell';
import { ActionBar, BarSpacer, Callout, Icon, NumberField, Sheet, Toast } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import {
  allProducts, currentSettings, getEstimate, lookupZone, postCalculate, saveEstimate,
} from '@/api/client';
import { defaultWastageFor } from '@/lib/calc';
import { imageUrl } from '@/lib/texture';
import { kg, rupees, sqft as fmtSqft, rate as fmtRate } from '@/lib/format';
import { track } from '@/lib/analytics';
import type { AreaInput, CalcResult, Estimate as Est, Product, Zone } from '@/types';

/**
 * PRD §5 — both doors converge here. This is the app's real centre of gravity
 * and the screen that turns a browser into a lead.
 *
 * It shows the breakdown, never a single opaque number (PRD §7.8), keeps every
 * add-on separable (§7.5), and carries the "final rate confirmed by shop"
 * disclaimer on every view (F-5.2). Where the engine cannot price honestly —
 * a slab, a PIN outside the map, a load over the zone's weight ceiling — it
 * says so instead of guessing.
 */
export default function Estimate() {
  const { ref } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, pick } = useI18n();
  const { pin, setPin, addToHouse } = useApp();
  const settings = currentSettings();

  const [product, setProduct] = useState<Product | null>(null);
  const [areas, setAreas] = useState<AreaInput[]>([]);
  const [wastage, setWastage] = useState(settings.defaultWastagePct);
  const [addons, setAddons] = useState({ skirting: false, adhesive: false, grout: false, cutting: false });
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [pinDraft, setPinDraft] = useState(pin || '');
  const [saved, setSaved] = useState<Est | null>(null);
  const [sheet, setSheet] = useState<'none' | 'wastage' | 'areas' | 'share'>('none');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // --- load a saved estimate by reference, or build a new one from params ---
  useEffect(() => {
    if (!ref || ref === 'new') return;
    getEstimate(ref).then((r) => {
      if (r.data) {
        setSaved(r.data);
        const p = allProducts().find((x) => x.slug === r.data!.lines[0]?.productSlug);
        if (p) setProduct(p);
      } else setError(r.error!.message);
    });
  }, [ref]);

  useEffect(() => {
    if (ref && ref !== 'new') return;
    const slug = params.get('product');
    const p = allProducts().find((x) => x.slug === slug);
    if (!p) { setError('Pick a product first.'); return; }
    setProduct(p);
    setWastage(defaultWastageFor(p, settings));

    try {
      const raw = JSON.parse(params.get('areas') ?? '[]') as { label: string; l: number; w: number }[];
      const valid = raw.filter((a) => a.l > 0 && a.w > 0);
      setAreas(valid.length
        ? valid.map((a) => ({ areaLabel: a.label, lengthFt: a.l, widthFt: a.w }))
        : [{ areaLabel: 'My room', lengthFt: 0, widthFt: 0 }]);
    } catch {
      setAreas([{ areaLabel: 'My room', lengthFt: 0, widthFt: 0 }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, ref]);

  useEffect(() => {
    if (pinDraft.length === 6) lookupZone(pinDraft).then((r) => setZone(r.data ?? null));
    else setZone(null);
  }, [pinDraft]);

  const variantId = params.get('variant') ?? undefined;
  const ready = areas.some((a) => a.lengthFt > 0 && a.widthFt > 0);

  const run = useCallback(async () => {
    if (!product || !ready) { setCalc(null); return; }
    const r = await postCalculate({
      items: [{
        productId: product.id,
        variantId,
        areas: areas.filter((a) => a.lengthFt > 0 && a.widthFt > 0),
        wastagePctOverride: wastage,
        includeSkirting: addons.skirting,
        includeAdhesive: addons.adhesive,
        includeGrout: addons.grout,
        includeCutting: addons.cutting,
      }],
      pinCode: pinDraft,
    });
    if (r.data) {
      setCalc(r.data);
      setError('');
      track('estimate_generated', {
        slug: product.slug, total: Math.round(r.data.total), sqft: r.data.lines[0].areaSqft,
      });
    } else {
      setCalc(null);
      setError(r.error!.message);
    }
  }, [product, areas, wastage, addons, pinDraft, variantId, ready]);

  useEffect(() => { run(); }, [run]);

  // A saved estimate renders from its snapshot, never recomputed (TRD §4.1/T7).
  const view = saved
    ? {
        lines: saved.lines,
        materialSubtotal: saved.materialSubtotal,
        addonsTotal: saved.addonsTotal,
        deliveryCharge: saved.deliveryCharge,
        deliveryNeedsQuote: saved.deliveryNeedsQuote,
        gstAmount: saved.gstAmount,
        total: saved.total,
        warnings: saved.warnings,
        zone: saved.zoneName ? { id: '', name: saved.zoneName } : null,
        totalWeightKg: 0,
      }
    : calc;

  const line = view?.lines[0];

  async function persist(): Promise<Est | null> {
    if (saved) return saved;
    if (!calc || !product) return null;
    setBusy(true);
    const r = await saveEstimate({
      pinCode: pinDraft,
      zoneName: calc.zone?.name ?? null,
      wastagePct: wastage,
      lines: calc.lines.map((l, i) => ({
        ...l,
        id: 'l-' + i,
        productName: product.nameEn,
        productSlug: product.slug,
        sizeMm: product.sizeMm,
        imageSeed: product.images[0].cdnPublicId,
      })),
      materialSubtotal: calc.materialSubtotal,
      addonsTotal: calc.addonsTotal,
      deliveryCharge: calc.deliveryCharge,
      deliveryNeedsQuote: calc.deliveryNeedsQuote,
      gstAmount: calc.gstAmount,
      total: calc.total,
      warnings: calc.warnings,
      source: params.get('areas') ? 'wizard' : 'browse',
    });
    setBusy(false);
    if (r.data) { setSaved(r.data); setPin(pinDraft); return r.data; }
    return null;
  }

  async function toEnquiry() {
    const e = await persist();
    navigate('/enquiry' + (e ? '?ref=' + e.referenceNo : ''));
  }

  const shareText = useMemo(() => {
    if (!view || !product) return '';
    const l = view.lines[0];
    return [
      'Roman Marbel — estimate' + (saved ? ' ' + saved.referenceNo : ''),
      product.nameEn + ' (' + product.sizeMm + ')',
      'Area: ' + l.areaSqft.toFixed(2) + ' sq ft, with ' + l.wastagePct + '% wastage = ' + l.areaWithWastage.toFixed(2) + ' sq ft',
      l.boxes != null ? 'Boxes: ' + l.boxes + ' (' + l.actualSqftPurchased.toFixed(2) + ' sq ft purchased)' : 'Slab: ' + l.actualSqftPurchased.toFixed(2) + ' sq ft',
      'Rate: ' + fmtRate(l.ratePerSqft),
      'Material: ' + rupees(view.materialSubtotal),
      view.addonsTotal ? 'Add-ons: ' + rupees(view.addonsTotal) : '',
      'GST: ' + rupees(view.gstAmount),
      view.deliveryNeedsQuote ? 'Delivery: quoted by the shop' : 'Delivery: ' + rupees(view.deliveryCharge),
      'Estimated total: ' + rupees(view.total),
      '',
      'Estimate only — final rate confirmed by the shop.',
    ].filter(Boolean).join('\n');
  }, [view, product, saved]);

  if (error && !product) {
    return (
      <>
        <TopBar back title={t('estimate')} />
        <main className="px-4 py-16 text-center">
          <p className="font-display text-h3">{error}</p>
          <Link to="/catalogue" className="btn-primary mt-6 inline-flex">Browse the catalogue</Link>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <TopBar back title={t('estimate')} />
        <div className="space-y-3 px-4 pt-4">
          <div className="skeleton h-24 rounded" /><div className="skeleton h-40 rounded" />
          <div className="skeleton h-32 rounded" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        back
        title={saved ? saved.referenceNo : t('yourEstimate')}
        subtitle={saved ? 'Saved estimate' : undefined}
      />

      <main className="px-4 pt-4">
        {/* Product identity */}
        <div className="card flex gap-3 p-3">
          <img
            src={imageUrl({
              seed: product.images[0].cdnPublicId, material: product.material,
              hex: product.colourHexPrimary, type: 'flat', sizeMm: product.sizeMm,
            }, 'thumb')}
            alt="" width={64} height={80}
            className="h-20 w-16 shrink-0 rounded-sm object-cover"
          />
          <div className="min-w-0 flex-1">
            <Link to={'/product/' + product.slug} className="text-small font-semibold leading-snug">
              {pick(product.nameEn, product.nameBn)}
            </Link>
            <p className="mt-0.5 text-micro text-muted">{product.sizeMm}</p>
            <p className="mt-1 font-display text-base">
              {fmtRate(line?.ratePerSqft ?? product.ratePerSqft)}
            </p>
          </div>
        </div>

        {/* Area entry — editable in place unless viewing a saved snapshot */}
        {!saved && (
          <section className="mt-4">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">{t('floorArea')}</h2>
              <button
                onClick={() => setSheet('areas')}
                className="text-small font-semibold text-accent"
                style={{ minHeight: 32 }}
              >
                {areas.length > 1 ? areas.length + ' areas' : t('addAnotherArea')}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <NumberField
                label={t('length')} suffix="ft"
                value={areas[0]?.lengthFt ? String(areas[0].lengthFt) : ''}
                onChange={(v) => setAreas((a) => {
                  const next = [...a];
                  next[0] = { ...next[0], lengthFt: parseFloat(v) || 0 };
                  return next;
                })}
                placeholder="14"
              />
              <NumberField
                label={t('width')} suffix="ft"
                value={areas[0]?.widthFt ? String(areas[0].widthFt) : ''}
                onChange={(v) => setAreas((a) => {
                  const next = [...a];
                  next[0] = { ...next[0], widthFt: parseFloat(v) || 0 };
                  return next;
                })}
                placeholder="12"
              />
            </div>
            {areas.length > 1 && (
              <p className="mt-2 text-micro text-muted">
                + {areas.length - 1} more {areas.length === 2 ? 'area' : 'areas'} — tap above to edit.
              </p>
            )}
          </section>
        )}

        {/* PIN / zone */}
        {!saved && (
          <section className="mt-4">
            <h2 className="eyebrow">{t('deliveryPin')}</h2>
            <input
              inputMode="numeric"
              maxLength={6}
              value={pinDraft}
              onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="713407"
              className="field mt-2 font-display tracking-wider"
              aria-label={t('deliveryPin')}
            />
            {zone && (
              <p className="mt-1.5 text-micro text-success">
                {zone.name} — {zone.label}
              </p>
            )}
          </section>
        )}

        {error && !line && (
          <div className="mt-4"><Callout tone="danger">{error}</Callout></div>
        )}

        {!ready && !saved && (
          <div className="mt-4">
            <Callout tone="neutral">Enter your room size to see the estimate.</Callout>
          </div>
        )}

        {/* ── The breakdown ────────────────────────────────────────────── */}
        {line && view && (
          <>
            <section className="mt-5 card overflow-hidden">
              <div className="border-b border-line bg-raised/50 px-4 py-3">
                <h2 className="font-display text-h3">{t('estimate')}</h2>
              </div>

              <dl className="divide-y divide-line px-4 text-small">
                <Row k={t('floorArea')} v={fmtSqft(line.areaSqft)} />
                <Row
                  k={
                    <button
                      onClick={() => setSheet('wastage')}
                      className="flex items-center gap-1 text-left text-muted underline decoration-dotted underline-offset-2"
                      style={{ minHeight: 32 }}
                    >
                      {t('wastage')} ({line.wastagePct}%)
                      <Icon name="info" size={13} />
                    </button>
                  }
                  v={fmtSqft(line.areaWithWastage)}
                />
                {line.boxes != null ? (
                  <>
                    <Row k={t('boxesNeeded')} v={line.boxes + ' boxes'} strong />
                    <Row
                      k={t('actualPurchased')}
                      v={fmtSqft(line.actualSqftPurchased)}
                      note={line.piecesTotal ? line.piecesTotal + ' pieces' : undefined}
                    />
                  </>
                ) : (
                  <Row
                    k="Slab material"
                    v={fmtSqft(line.actualSqftPurchased)}
                    note="Priced by area — slab sizes are irregular"
                    strong
                  />
                )}
                <Row k={t('rateApplied')} v={fmtRate(line.ratePerSqft)} />
                <Row k={t('materialSubtotal')} v={rupees(view.materialSubtotal)} strong />
              </dl>
            </section>

            {/* Add-ons — opt-in and separable (PRD §7.5) */}
            {!saved && (
              <section className="mt-4">
                <h2 className="eyebrow mb-2">{t('addOns')}</h2>
                <div className="card divide-y divide-line">
                  <AddOn
                    label={t('skirting')}
                    hint={line.skirtingFt ? line.skirtingFt + ' running ft @ ₹' + settings.skirtingRatePerFt + '/ft' : 'Perimeter of the room, priced per running foot'}
                    cost={line.skirtingCost}
                    on={addons.skirting}
                    onToggle={() => setAddons((a) => ({ ...a, skirting: !a.skirting }))}
                  />
                  <AddOn
                    label={t('adhesive')}
                    hint={line.adhesiveBags ? line.adhesiveBags + ' bags @ ₹' + settings.adhesiveBagPrice : '1 bag covers about ' + settings.adhesiveCoverageSqftPerBag + ' sq ft'}
                    cost={line.adhesiveCost}
                    on={addons.adhesive}
                    onToggle={() => setAddons((a) => ({ ...a, adhesive: !a.adhesive }))}
                  />
                  <AddOn
                    label={t('grout')}
                    hint={line.groutKg ? line.groutKg.toFixed(1) + ' kg @ ₹' + settings.groutPricePerKg + '/kg' : 'About ' + settings.groutFactorKgPerSqft + ' kg per sq ft'}
                    cost={line.groutCost}
                    on={addons.grout}
                    onToggle={() => setAddons((a) => ({ ...a, grout: !a.grout }))}
                  />
                  <AddOn
                    label={t('cutting')}
                    hint="Flat charge per order for cutting at the shop"
                    cost={line.cuttingCost}
                    on={addons.cutting}
                    onToggle={() => setAddons((a) => ({ ...a, cutting: !a.cutting }))}
                  />
                </div>
              </section>
            )}

            {/* Totals */}
            <section className="mt-4 card overflow-hidden">
              <dl className="divide-y divide-line px-4 text-small">
                <Row k={t('materialSubtotal')} v={rupees(view.materialSubtotal)} />
                {view.addonsTotal > 0 && <Row k={t('addOns')} v={rupees(view.addonsTotal)} />}
                <Row
                  k={t('delivery') + (view.zone ? ' · ' + view.zone.name.replace(/ —.*/, '') : '')}
                  v={view.deliveryNeedsQuote ? t('deliveryQuoted') : view.deliveryCharge === 0 ? 'Free' : rupees(view.deliveryCharge)}
                />
                <Row k={t('gst') + ' @ ' + settings.gstRatePct + '%'} v={rupees(view.gstAmount)} />
              </dl>
              <div className="flex items-baseline justify-between gap-3 bg-deep px-4 py-4 text-hi">
                <span className="text-small">{t('total')}</span>
                <span className="font-display text-h1">{rupees(view.total)}</span>
              </div>
              <p className="bg-deep px-4 pb-4 text-right text-micro text-hi/60">
                {t('estimateDisclaimer')}
              </p>
            </section>

            {/* Warnings — the engine's honest refusals */}
            {view.warnings.length > 0 && (
              <div className="mt-4 space-y-2">
                {view.warnings.map((w) => (
                  <Callout key={w} tone="warning">{w}</Callout>
                ))}
              </div>
            )}

            {view.totalWeightKg > 0 && (
              <p className="mt-3 text-micro text-muted">
                Approximate load: {kg(view.totalWeightKg)}. Tell us if the approach to
                the site is narrow or unmetalled.
              </p>
            )}

            <div className="mt-4 space-y-3">
              <Callout tone="neutral" title="Buy it all in one batch">
                Shade varies between batches. Order the full requirement now — running
                short later almost always means a visible mismatch.
              </Callout>
              <p className="text-micro leading-relaxed text-muted">{settings.labourRangeText}</p>
            </div>

            <BarSpacer tall />
          </>
        )}
      </main>

      {line && view && (
        <ActionBar>
          <button onClick={toEnquiry} disabled={busy} className="btn-primary w-full">
            {busy ? t('loading') : t('sendEnquiry')}
          </button>
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => { await persist(); setSheet('share'); }}
              className="btn-secondary flex-1 text-small"
            >
              <Icon name="share" size={16} /> {t('saveShare')}
            </button>
            {!saved && (
              <button
                onClick={() => {
                  addToHouse({
                    label: areas[0]?.areaLabel || 'Area',
                    productId: product.id,
                    variantId,
                    areas: areas.filter((x) => x.lengthFt > 0 && x.widthFt > 0),
                    wastagePct: wastage,
                    includeSkirting: addons.skirting,
                    includeAdhesive: addons.adhesive,
                    includeGrout: addons.grout,
                    includeCutting: addons.cutting,
                  });
                  setToast('Added to My House');
                }}
                className="btn-secondary flex-1 text-small"
              >
                <Icon name="home" size={16} /> {t('addToMyHouse')}
              </button>
            )}
          </div>
        </ActionBar>
      )}

      {/* ── Wastage editor (F-5.3) ───────────────────────────────────────── */}
      <Sheet open={sheet === 'wastage'} onClose={() => setSheet('none')} title={t('wastage')}>
        <p className="text-small leading-relaxed text-muted">{t('wastageHelp')}</p>
        <div className="mt-5 text-center">
          <p className="font-display text-display">{wastage}%</p>
        </div>
        <input
          type="range"
          min={settings.minWastagePct}
          max={settings.maxWastagePct}
          step={1}
          value={wastage}
          onChange={(e) => setWastage(parseInt(e.target.value, 10))}
          className="mt-3 w-full accent-[#4d7cfe]"
          aria-label={t('wastage')}
        />
        <div className="flex justify-between text-micro text-muted">
          <span>{settings.minWastagePct}%</span><span>{settings.maxWastagePct}%</span>
        </div>

        <table className="mt-6 w-full text-small">
          <tbody className="divide-y divide-line">
            {[
              ['Simple rectangular room, large tile', '8%'],
              ['Many cuts, L-shape or pillars', '10–12%'],
              ['Diagonal or pattern laying', '12–15%'],
              ['Small format or mosaic', '10%'],
              ['Natural marble or granite slab', '12%+'],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="py-2.5 pr-3 text-muted">{k}</td>
                <td className="py-2.5 text-right font-medium">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Callout tone="neutral">
          Under-estimating is the worse mistake. A customer who runs short mid-job
          may not get the same batch again.
        </Callout>
      </Sheet>

      {/* ── Multi-area editor (F-3.3/F-3.4) ──────────────────────────────── */}
      <Sheet
        open={sheet === 'areas'}
        onClose={() => setSheet('none')}
        title="Areas"
        footer={
          <button
            onClick={() => setAreas((a) => [...a, { areaLabel: 'Area ' + (a.length + 1), lengthFt: 0, widthFt: 0 }])}
            className="btn-secondary w-full"
          >
            <Icon name="plus" size={18} /> {t('addAnotherArea')}
          </button>
        }
      >
        <p className="mb-4 text-small text-muted">{t('lShaped')}</p>
        <div className="space-y-4">
          {areas.map((a, i) => (
            <div key={i} className="card p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={a.areaLabel ?? ''}
                  onChange={(e) => setAreas((prev) => {
                    const n = [...prev]; n[i] = { ...n[i], areaLabel: e.target.value }; return n;
                  })}
                  aria-label="Area name"
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 font-medium focus:outline-none"
                />
                {areas.length > 1 && (
                  <button
                    onClick={() => setAreas((prev) => prev.filter((_, x) => x !== i))}
                    aria-label={t('removeArea')}
                    className="grid h-9 w-9 place-items-center rounded-pill text-muted"
                    style={{ minHeight: 36, minWidth: 36 }}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label={t('length')} suffix="ft" value={a.lengthFt ? String(a.lengthFt) : ''}
                  onChange={(v) => setAreas((prev) => {
                    const n = [...prev]; n[i] = { ...n[i], lengthFt: parseFloat(v) || 0 }; return n;
                  })}
                />
                <NumberField
                  label={t('width')} suffix="ft" value={a.widthFt ? String(a.widthFt) : ''}
                  onChange={(v) => setAreas((prev) => {
                    const n = [...prev]; n[i] = { ...n[i], widthFt: parseFloat(v) || 0 }; return n;
                  })}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-micro text-muted">
          Wastage is applied once to the total area, not to each room separately.
        </p>
      </Sheet>

      {/* ── Share (F-5.6) ────────────────────────────────────────────────── */}
      <Sheet open={sheet === 'share'} onClose={() => setSheet('none')} title={t('saveShare')}>
        {saved && (
          <div className="mb-4 rounded border border-line bg-surface p-4 text-center">
            <p className="eyebrow">{t('yourReference')}</p>
            <p className="mt-1 font-display text-h1 tracking-wide">{saved.referenceNo}</p>
            <p className="mt-1 text-micro text-muted">
              Quote this at the shop. Saved on this phone for 30 days.
            </p>
          </div>
        )}
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-sm border border-line bg-surface p-3 text-micro leading-relaxed">
          {shareText}
        </pre>
        <div className="mt-4 space-y-2">
          <a
            href={contactLinks().wa(shareText)}
            target="_blank"
            rel="noreferrer"
            onClick={() => track('estimate_shared', { channel: 'whatsapp' })}
            className="btn-primary w-full"
          >
            Send on WhatsApp
          </a>
          <button
            onClick={async () => {
              try {
                if (navigator.share) await navigator.share({ text: shareText, title: 'Roman Marbel estimate' });
                else { await navigator.clipboard.writeText(shareText); setToast('Copied'); }
                track('estimate_shared', { channel: 'system' });
              } catch { /* user dismissed the share sheet */ }
            }}
            className="btn-secondary w-full"
          >
            Share another way
          </button>
          <button onClick={() => window.print()} className="btn-ghost w-full text-small text-muted">
            Print / save as PDF
          </button>
        </div>
      </Sheet>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
      <Footer />
    </>
  );
}

function Row({
  k, v, strong, note,
}: { k: React.ReactNode; v: string; strong?: boolean; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">
        <span className={strong ? 'font-display text-base font-semibold' : 'font-medium'}>{v}</span>
        {note && <span className="block text-micro text-muted">{note}</span>}
      </dd>
    </div>
  );
}


/**
 * An add-on row. iOS puts the switch on the trailing edge and folds the detail
 * into the subtitle, so the price rides with the explanation rather than
 * competing with the control for the right-hand edge.
 */
function AddOn({
  label, hint, cost, on, onToggle,
}: { label: string; hint: string; cost: number; on: boolean; onToggle: () => void }) {
  return (
    <label className="row-press flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-base">{label}</span>
          {on && <span className="font-semibold text-accent">{rupees(cost)}</span>}
        </span>
        <span className="mt-0.5 block text-micro leading-snug text-muted">{hint}</span>
      </span>
      <span className="switch shrink-0" data-on={on} aria-hidden />
      <input
        type="checkbox"
        role="switch"
        className="sr-only"
        checked={on}
        aria-label={label}
        onChange={onToggle}
      />
    </label>
  );
}
