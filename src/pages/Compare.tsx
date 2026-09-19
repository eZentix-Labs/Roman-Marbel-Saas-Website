import { Link } from 'react-router-dom';
import { TopBar, Footer } from '@/components/layout/AppShell';
import { Icon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import { allProducts } from '@/api/client';
import { imageUrl } from '@/lib/texture';
import {
  BAND_LABEL, FINISH_LABEL, MATERIAL_LABEL, relativeDays, STOCK_LABEL,
} from '@/lib/format';

/**
 * PRD F-2.6 — compare up to three products side by side.
 *
 * On a 360px screen a three-column table only works if it scrolls horizontally
 * with the attribute column pinned, which is what this does. Three is the hard
 * ceiling: a fourth column makes every value too narrow to read, and an
 * unreadable comparison is worse than none.
 */
export default function Compare() {
  const { t, pick, lang } = useI18n();
  const { compare, toggleCompare, clearCompare } = useApp();
  const products = allProducts().filter((p) => compare.includes(p.id));

  if (!products.length) {
    return (
      <>
        <TopBar back title={t('compare')} />
        <main className="px-4 py-16 text-center">
          <Icon name="layers" size={40} className="mx-auto text-line" />
          <p className="mt-4 font-display text-h2">Nothing to compare yet</p>
          <p className="mx-auto mt-2 max-w-[30ch] text-small text-muted">
            Tap the + on any product in the catalogue to add it here. Up to three
            at a time.
          </p>
          <Link to="/catalogue" className="btn-primary mt-6 inline-flex">Browse the catalogue</Link>
        </main>
        <Footer />
      </>
    );
  }

  const ROWS: { label: string; get: (p: typeof products[0]) => React.ReactNode }[] = [
    { label: 'Rate', get: (p) => <span className="font-display text-base font-semibold">₹{p.ratePerSqft}</span> },
    { label: 'MRP', get: (p) => (p.mrpPerSqft ? '₹' + p.mrpPerSqft : '—') },
    { label: t('size'), get: (p) => p.sizeMm },
    { label: t('material'), get: (p) => MATERIAL_LABEL[p.material] },
    { label: t('finish'), get: (p) => FINISH_LABEL[p.finish] },
    { label: 'Band', get: (p) => BAND_LABEL[p.budgetBand] },
    {
      label: 'Stock',
      get: (p) => (
        <span className={STOCK_LABEL[p.stockStatus].tone}>
          {lang === 'bn' ? STOCK_LABEL[p.stockStatus].bn : STOCK_LABEL[p.stockStatus].en}
        </span>
      ),
    },
    { label: t('piecesPerBox'), get: (p) => (p.piecesPerBox ? String(p.piecesPerBox) : '— (slab)') },
    { label: t('sqftPerBox'), get: (p) => (p.sqftPerBox ? p.sqftPerBox + ' sq ft' : '— (slab)') },
    { label: 'Weight', get: (p) => p.weightPerSqft + ' kg/sq ft' },
    { label: 'Sold by', get: (p) => (p.pricingUnit === 'box' ? 'Box' : 'Square foot') },
    { label: t('colour'), get: (p) => p.colourFamily.join(', ') },
    {
      label: 'Suitable for',
      get: (p) => p.application.map((a) => a.replace(/^\w/, (c) => c.toUpperCase())).join(', ') || '—',
    },
    { label: 'Rate updated', get: (p) => relativeDays(p.rateUpdatedAt) },
    {
      label: 'Shade note',
      get: (p) => (p.shadeVariationNote ? 'Varies by batch' : 'Consistent'),
    },
  ];

  const COL = 132;

  return (
    <>
      <TopBar
        back
        title={t('compare')}
        subtitle={products.length + ' of 3'}
        right={
          <button
            onClick={clearCompare}
            className="px-2 text-small font-medium text-muted"
            style={{ minHeight: 44 }}
          >
            {t('clear')}
          </button>
        }
      />

      <main className="pt-4">
        <div className="overflow-x-auto">
          <table className="w-max border-collapse text-small">
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-10 bg-ink p-0 align-bottom"
                  style={{ width: 96, minWidth: 96 }}
                >
                  <span className="sr-only">Attribute</span>
                </th>
                {products.map((p) => (
                  <th key={p.id} className="p-2 align-top" style={{ width: COL, minWidth: COL }}>
                    <div className="card overflow-hidden text-left">
                      <div className="relative">
                        <Link to={'/product/' + p.slug}>
                          <img
                            src={imageUrl({
                              seed: p.images[0].cdnPublicId, material: p.material,
                              hex: p.colourHexPrimary, type: 'flat', sizeMm: p.sizeMm,
                            }, 'thumb')}
                            alt="" width={COL} height={100}
                            className="h-[100px] w-full object-cover"
                          />
                        </Link>
                        <button
                          onClick={() => toggleCompare(p.id)}
                          aria-label={'Remove ' + p.nameEn}
                          className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-pill bg-black/50 text-white backdrop-blur-[2px]"
                          style={{ minHeight: 32, minWidth: 32 }}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                      <Link
                        to={'/product/' + p.slug}
                        className="block p-2 text-micro font-semibold leading-snug"
                      >
                        {pick(p.nameEn, p.nameBn)}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 ? 'bg-surface' : ''}>
                  <th
                    scope="row"
                    className={
                      'sticky left-0 z-10 border-y border-line px-3 py-2.5 text-left text-micro font-medium text-muted ' +
                      (i % 2 ? 'bg-surface' : 'bg-ink')
                    }
                  >
                    {row.label}
                  </th>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className="border-y border-line px-3 py-2.5 align-top"
                      style={{ width: COL, minWidth: COL }}
                    >
                      {row.get(p)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 bg-ink" />
                {products.map((p) => (
                  <td key={p.id} className="p-2">
                    <Link
                      to={'/estimate/new?product=' + p.slug}
                      className="btn-primary w-full px-2 text-micro"
                      style={{ minHeight: 44 }}
                    >
                      Calculate
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="px-4 pt-4 text-micro leading-relaxed text-muted">
          Rates are per square foot, exclusive of GST. Box counts assume the nominal
          size — the calculator works out what your room actually needs.
        </p>
      </main>

      <Footer />
    </>
  );
}
