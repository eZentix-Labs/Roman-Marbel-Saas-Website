import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TopBar, Footer } from '@/components/layout/AppShell';
import { ActionBar, BarSpacer, Callout, Icon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { houseAreaToCalcItem, useApp } from '@/state/AppState';
import { allProducts, currentSettings, postCalculate, saveEstimate } from '@/api/client';
import { imageUrl } from '@/lib/texture';
import { rupees, sqft as fmtSqft } from '@/lib/format';
import type { CalcResult } from '@/types';

/**
 * PRD F-5.5 / §5 "Room-level thinking" — an Indian tile purchase is almost never
 * one product. It is "floor for the whole house, different tile for the two
 * bathrooms, something better for the living room". This screen sums several
 * areas, each with its own product, into one estimate with a per-area breakdown.
 *
 * This is what contractors and builders actually need and what no local
 * competitor offers.
 */
export default function MyHouse() {
  const { t, pick } = useI18n();
  const navigate = useNavigate();
  const { house, removeHouseArea, clearHouse, pin } = useApp();
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [busy, setBusy] = useState(false);
  const settings = currentSettings();
  const products = allProducts();

  const run = useCallback(async () => {
    if (!house.length) { setCalc(null); return; }
    const r = await postCalculate({
      items: house.map(houseAreaToCalcItem),
      pinCode: pin || '713407',
    });
    setCalc(r.data);
  }, [house, pin]);

  useEffect(() => { run(); }, [run]);

  async function toEnquiry() {
    if (!calc) return;
    setBusy(true);
    const r = await saveEstimate({
      pinCode: pin,
      zoneName: calc.zone?.name ?? null,
      wastagePct: calc.lines[0]?.wastagePct ?? settings.defaultWastagePct,
      lines: calc.lines.map((l, i) => {
        const area = house[i];
        const p = products.find((x) => x.id === l.productId)!;
        return {
          ...l,
          id: 'l-' + i,
          areaLabel: area?.label ?? l.areaLabel,
          productName: p.nameEn,
          productSlug: p.slug,
          sizeMm: p.sizeMm,
          imageSeed: p.images[0].cdnPublicId,
        };
      }),
      materialSubtotal: calc.materialSubtotal,
      addonsTotal: calc.addonsTotal,
      deliveryCharge: calc.deliveryCharge,
      deliveryNeedsQuote: calc.deliveryNeedsQuote,
      gstAmount: calc.gstAmount,
      total: calc.total,
      warnings: calc.warnings,
      source: 'myhouse',
    });
    setBusy(false);
    navigate('/enquiry' + (r.data ? '?ref=' + r.data.referenceNo : ''));
  }

  if (!house.length) {
    return (
      <>
        <TopBar back title={t('myHouse')} />
        <main className="px-4 py-16 text-center">
          <Icon name="home" size={40} className="mx-auto text-line" />
          <p className="mt-4 font-display text-h2">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-[32ch] text-small leading-relaxed text-muted">
            {t('myHouseSub')} Work out one room, add it here, then do the next.
            We will total the whole house.
          </p>
          <Link to="/wizard" className="btn-primary mt-6 inline-flex">Start with one room</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopBar back title={t('myHouse')} subtitle={house.length + ' areas'} />

      <main className="px-4 pt-4">
        <p className="text-small text-muted">{t('myHouseSub')}</p>

        <ul className="mt-4 space-y-3">
          {house.map((area, i) => {
            const p = products.find((x) => x.id === area.productId);
            const line = calc?.lines[i];
            if (!p) return null;
            return (
              <li key={area.id} className="card overflow-hidden">
                <div className="flex gap-3 p-3">
                  <img
                    src={imageUrl({
                      seed: p.images[0].cdnPublicId, material: p.material,
                      hex: p.colourHexPrimary, type: 'flat', sizeMm: p.sizeMm,
                    }, 'thumb')}
                    alt="" width={56} height={70}
                    loading="lazy" decoding="async"
                    className="h-[70px] w-14 shrink-0 rounded-sm object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-h3 leading-tight">{area.label}</p>
                    <p className="truncate text-micro text-muted">
                      {pick(p.nameEn, p.nameBn)} · {p.sizeMm}
                    </p>
                    {line && (
                      <p className="mt-1 text-small">
                        {line.boxes != null ? line.boxes + ' boxes · ' : ''}
                        {fmtSqft(line.actualSqftPurchased)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {line && (
                      <p className="font-display text-base font-semibold">
                        {rupees(line.materialCost + line.skirtingCost + line.adhesiveCost + line.groutCost + line.cuttingCost)}
                      </p>
                    )}
                    <button
                      onClick={() => removeHouseArea(area.id)}
                      aria-label={'Remove ' + area.label}
                      className="mt-1 grid h-9 w-9 place-items-center rounded-pill text-muted active:bg-raised"
                      style={{ minHeight: 36, minWidth: 36 }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
                {line && (
                  <p className="border-t border-line bg-raised/40 px-3 py-1.5 text-micro text-muted">
                    {fmtSqft(line.areaSqft)} + {line.wastagePct}% wastage = {fmtSqft(line.areaWithWastage)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <Link to="/wizard" className="btn-secondary mt-3 w-full">
          <Icon name="plus" size={18} /> Add another room
        </Link>

        {calc && (
          <section className="mt-6 card overflow-hidden">
            <dl className="divide-y divide-line px-4 text-small">
              <Row k={t('materialSubtotal')} v={rupees(calc.materialSubtotal)} />
              {calc.addonsTotal > 0 && <Row k={t('addOns')} v={rupees(calc.addonsTotal)} />}
              <Row
                k={t('delivery') + (calc.zone ? ' · ' + calc.zone.name.replace(/ —.*/, '') : '')}
                v={calc.deliveryNeedsQuote ? t('deliveryQuoted') : calc.deliveryCharge === 0 ? 'Free' : rupees(calc.deliveryCharge)}
              />
              <Row k={t('gst') + ' @ ' + settings.gstRatePct + '%'} v={rupees(calc.gstAmount)} />
            </dl>
            <div className="flex items-baseline justify-between gap-3 bg-deep px-4 py-4 text-hi">
              <span className="text-small">{t('grandTotal')}</span>
              <span className="font-display text-h1">{rupees(calc.total)}</span>
            </div>
            <p className="bg-deep px-4 pb-4 text-right text-micro text-hi/60">
              {t('estimateDisclaimer')}
            </p>
          </section>
        )}

        {calc && calc.warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {calc.warnings.map((w) => <Callout key={w} tone="warning">{w}</Callout>)}
          </div>
        )}

        <button
          onClick={() => { if (confirm('Clear every area from My House?')) clearHouse(); }}
          className="mt-6 w-full text-small text-muted underline underline-offset-2"
          style={{ minHeight: 44 }}
        >
          Clear My House
        </button>

        <BarSpacer />
      </main>

      <ActionBar>
        <button onClick={toEnquiry} disabled={busy || !calc} className="btn-primary w-full">
          {busy ? t('loading') : t('sendEnquiry')}
        </button>
      </ActionBar>

      <Footer />
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
