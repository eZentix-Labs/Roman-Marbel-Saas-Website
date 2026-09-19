import { Link } from 'react-router-dom';
import type { Product } from '@/types';
import { imageUrl, TRANSFORMS } from '@/lib/texture';
import { BAND_LABEL, FINISH_LABEL, rate as fmtRate, STOCK_LABEL } from '@/lib/format';
import { useI18n } from '@/i18n';
import { Icon } from '@/components/ui';

/**
 * The photo grid is the product (PRD §2.1). Image-dominant, name and rate on the
 * card itself, 2 columns on mobile (F-2.1).
 *
 * Every image carries explicit width/height so the grid cannot shift as photos
 * load — N-1.4 puts CLS under 0.1, and a grid that jumps while a thumb is
 * reaching for a card is the fastest way to lose the tap.
 */
export function ProductCard({
  product, onCompare, comparing, eager,
}: {
  product: Product; onCompare?: (id: string) => void; comparing?: boolean; eager?: boolean;
}) {
  const { pick, lang } = useI18n();
  const stock = STOCK_LABEL[product.stockStatus];
  const flat = product.images.find((i) => i.type === 'flat') ?? product.images[0];

  return (
    <article className="card group relative overflow-hidden">
      <Link to={'/product/' + product.slug} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-raised">
          <img
            src={imageUrl({
              seed: flat.cdnPublicId,
              material: product.material,
              hex: product.colourHexPrimary,
              type: 'flat',
              sizeMm: product.sizeMm,
            }, 'thumb')}
            alt={pick(flat.altEn, flat.altBn)}
            width={TRANSFORMS.thumb.w}
            height={TRANSFORMS.thumb.h}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover"
          />
          <span
            className="absolute left-2 top-2 rounded-pill bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-[2px]"
          >
            {BAND_LABEL[product.budgetBand]}
          </span>
          {product.stockStatus === 'out' && (
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center text-micro font-semibold text-hi">
              {lang === 'bn' ? STOCK_LABEL.out.bn : STOCK_LABEL.out.en}
            </span>
          )}
        </div>

        <div className="p-3">
          <h3 className="line-clamp-2 text-small font-semibold leading-snug">
            {pick(product.nameEn, product.nameBn)}
          </h3>
          <p className="mt-1 text-micro text-muted">
            {product.sizeMm} · {FINISH_LABEL[product.finish]}
          </p>
          {/* Rate must never wrap — a two-line price breaks the grid's rhythm
              and makes the cheapest-looking card the tallest one. */}
          <div className="mt-2 flex items-baseline justify-between gap-1.5">
            <span className="whitespace-nowrap font-display text-base font-semibold">
              ₹{product.ratePerSqft.toLocaleString('en-IN')}
              <span className="text-micro font-normal text-muted">/sq ft</span>
            </span>
            {product.stockStatus !== 'out' && (
              <span className={'shrink-0 whitespace-nowrap text-[11px] font-medium ' + stock.tone}>
                {lang === 'bn' ? stock.bn : stock.en}
              </span>
            )}
          </div>
          {product.mrpPerSqft && product.mrpPerSqft > product.ratePerSqft && (
            <p className="mt-0.5 text-micro text-muted">
              <span className="line-through">₹{product.mrpPerSqft}</span> MRP
            </p>
          )}
        </div>
      </Link>

      {onCompare && (
        <button
          onClick={() => onCompare(product.id)}
          aria-pressed={comparing}
          aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
          className={
            'absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-pill border transition-colors ' +
            (comparing
              ? 'border-transparent bg-accent text-white'
              : 'border-white/25 bg-black/45 text-white backdrop-blur-[2px]')
          }
          style={{ minHeight: 36, minWidth: 36 }}
        >
          <Icon name={comparing ? 'check' : 'plus'} size={16} />
        </button>
      )}
    </article>
  );
}

/** Dense row for the contractor path — P2 wants a rate list, not a gallery. */
export function ProductRow({ product }: { product: Product }) {
  const { pick, lang } = useI18n();
  const stock = STOCK_LABEL[product.stockStatus];
  const flat = product.images[0];
  return (
    <Link
      to={'/product/' + product.slug}
      className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2.5 active:bg-raised"
    >
      <img
        src={imageUrl({
          seed: flat.cdnPublicId, material: product.material,
          hex: product.colourHexPrimary, type: 'flat', sizeMm: product.sizeMm,
        }, 'thumb')}
        alt=""
        width={48} height={48}
        loading="lazy" decoding="async"
        className="h-12 w-12 shrink-0 rounded-sm object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium">{pick(product.nameEn, product.nameBn)}</p>
        <p className="text-micro text-muted">
          {product.sizeMm} · {FINISH_LABEL[product.finish]}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-small font-semibold">₹{product.ratePerSqft}</p>
        <p className={'text-[11px] ' + stock.tone}>{lang === 'bn' ? stock.bn : stock.en}</p>
      </div>
    </Link>
  );
}
