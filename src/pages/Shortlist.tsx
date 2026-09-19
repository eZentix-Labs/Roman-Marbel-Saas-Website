import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TopBar, Footer } from '@/components/layout/AppShell';
import { Callout, GridSkeleton, Icon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import { allProducts, currentSettings, getProducts, postCalculate } from '@/api/client';
import { BUDGET_BANDS, ROOMS } from '@/api/mock/categories';
import { imageUrl } from '@/lib/texture';
import { FINISH_LABEL, rupees, rate as fmtRate, STOCK_LABEL } from '@/lib/format';
import type { CalcResult, Product } from '@/types';

interface Scored {
  product: Product;
  calc: CalcResult;
  score: number;
}

/**
 * PRD F-3.6 — the wizard's output is a ranked shortlist where the box count and
 * the estimated total are already worked out for *this customer's room*, per
 * option. A normal filtered grid would show the same products; what converts is
 * seeing "11 boxes, ₹15,944" against each one without asking for anything more.
 */
export default function Shortlist() {
  const { t, lang, pick } = useI18n();
  const { pin } = useApp();
  const [params] = useSearchParams();

  const [rows, setRows] = useState<Scored[]>([]);
  const [loading, setLoading] = useState(true);

  const room = params.get('room') ?? undefined;
  const colours = params.get('colour')?.split(',').filter(Boolean) ?? [];
  const budgetId = params.get('budget') ?? undefined;
  const sqft = parseFloat(params.get('sqft') ?? '0');

  const areas = useMemo(() => {
    try {
      const raw = JSON.parse(params.get('areas') ?? '[]') as { label: string; l: number; w: number }[];
      return raw.filter((a) => a.l > 0 && a.w > 0);
    } catch { return []; }
  }, [params]);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      const band = BUDGET_BANDS.find((b) => b.id === budgetId);
      const roomDef = ROOMS.find((r) => r.id === room);

      const r = await getProducts({
        application: roomDef?.applications,
        colour: colours.length ? colours : undefined,
        rateMin: band && band.id !== 'any' ? band.min : undefined,
        rateMax: band && band.id !== 'any' ? (band.max ?? undefined) : undefined,
        inStockOnly: true,
        pageSize: 24,
      });
      if (!live) return;

      let candidates = r.data?.items ?? [];

      // F-3.5 — skipping a step must widen, never empty. If the combination of
      // answers returns nothing, drop the narrowest constraint and try again
      // rather than showing a dead end.
      if (!candidates.length) {
        const wide = await getProducts({
          application: roomDef?.applications, inStockOnly: true, pageSize: 24,
        });
        candidates = wide.data?.items ?? [];
      }

      const calcAreas = areas.length
        ? areas.map((a) => ({ areaLabel: a.label, lengthFt: a.l, widthFt: a.w }))
        : [{ areaLabel: 'Your room', lengthFt: Math.sqrt(sqft || 100), widthFt: Math.sqrt(sqft || 100) }];

      const scored: Scored[] = [];
      for (const p of candidates.slice(0, 12)) {
        const res = await postCalculate({
          items: [{ productId: p.id, areas: calcAreas }],
          pinCode: pin || '713407',
        });
        if (!res.data) continue;

        // Ranking: how well it answers the brief, then value for money. Stock
        // and a room-preset match (F-3.7) both count.
        let score = 0;
        if (roomDef?.prefer.finish?.includes(p.finish)) score += 6;
        score += p.colourFamily.filter((c) => colours.includes(c)).length * 4;
        if (p.stockStatus === 'in') score += 3;
        if (p.isFeatured) score += 2;
        if (band && band.id !== 'any') {
          const mid = band.max ? (band.min + band.max) / 2 : band.min * 1.3;
          score -= Math.abs(p.ratePerSqft - mid) / 40;
        }
        scored.push({ product: p, calc: res.data, score });
      }

      if (!live) return;
      setRows(scored.sort((a, b) => b.score - a.score));
      setLoading(false);
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, pin]);

  const roomDef = ROOMS.find((r) => r.id === room);
  const settings = currentSettings();

  return (
    <>
      <TopBar
        back
        title={t('shortlistTitle')}
        subtitle={sqft ? sqft.toFixed(2) + ' sq ft' + (roomDef ? ' · ' + roomDef.labelEn : '') : undefined}
      />

      <main className="px-4 pt-4">
        <p className="text-small text-muted">{t('shortlistSub')}</p>

        {roomDef && (
          <p className="mt-3 rounded-sm border border-line bg-surface px-3 py-2 text-micro leading-relaxed text-muted">
            <Icon name="info" size={13} className="mr-1 inline align-[-2px] text-accent" />
            {roomDef.prefer.note}
          </p>
        )}

        {loading ? (
          <div className="mt-4"><GridSkeleton count={4} /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-h3">Nothing in stock matches that</p>
            <p className="mx-auto mt-2 max-w-[30ch] text-small text-muted">
              Call the shop — we often have material that has not made it onto the
              site yet.
            </p>
            <Link to="/catalogue" className="btn-secondary mt-5 inline-flex">Browse everything</Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map(({ product, calc }, i) => {
              const line = calc.lines[0];
              const stock = STOCK_LABEL[product.stockStatus];
              return (
                <li key={product.id}>
                  <Link
                    to={
                      '/estimate/new?product=' + product.slug +
                      '&areas=' + encodeURIComponent(params.get('areas') ?? '[]')
                    }
                    className="card flex gap-3 overflow-hidden p-3 active:bg-raised"
                  >
                    <img
                      src={imageUrl({
                        seed: product.images[0].cdnPublicId, material: product.material,
                        hex: product.colourHexPrimary, type: 'flat', sizeMm: product.sizeMm,
                      }, 'thumb')}
                      alt="" width={88} height={110}
                      loading={i < 3 ? 'eager' : 'lazy'} decoding="async"
                      className="h-[110px] w-[88px] shrink-0 rounded-sm object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="min-w-0 text-small font-semibold leading-snug">
                          {pick(product.nameEn, product.nameBn)}
                        </h2>
                        {i === 0 && (
                          <span className="shrink-0 rounded-pill bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Best match
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-micro text-muted">
                        {product.sizeMm} · {FINISH_LABEL[product.finish]} · {fmtRate(product.ratePerSqft)}
                      </p>

                      {/* The point of this screen */}
                      <div className="mt-2 rounded-sm bg-raised/70 px-2.5 py-2">
                        <p className="text-micro text-muted">
                          {line.boxes != null
                            ? line.boxes + ' boxes · ' + line.actualSqftPurchased.toFixed(2) + ' sq ft'
                            : line.actualSqftPurchased.toFixed(2) + ' sq ft (slab)'}
                        </p>
                        <p className="font-display text-h3 leading-tight">
                          {rupees(calc.total)}
                        </p>
                        <p className="text-[11px] text-muted">
                          incl. {line.wastagePct}% wastage &amp; GST
                          {calc.deliveryNeedsQuote ? ' · delivery quoted' : ''}
                        </p>
                      </div>

                      <p className={'mt-1.5 text-[11px] font-medium ' + stock.tone}>
                        {lang === 'bn' ? stock.bn : stock.en}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {rows.length > 0 && (
          <div className="mt-6 space-y-3">
            <Callout tone="warning" title={t('estimateDisclaimer')}>
              Every figure above is worked out from the rate on file and the size you
              gave us. The shop confirms the final rate — and anything it cannot price
              honestly says so rather than guessing.
            </Callout>
            <p className="text-micro leading-relaxed text-muted">{settings.labourRangeText}</p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
