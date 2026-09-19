import { Link, useParams } from 'react-router-dom';
import { TopBar, Footer, ContactPair, contactLinks } from '@/components/layout/AppShell';
import { Accordion, Callout, Icon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { currentSettings, allProducts } from '@/api/client';
import { GALLERY, GUIDES, POLICIES, REVIEWS_PLACEHOLDER } from '@/api/mock/content';
import { ZONES } from '@/api/mock/zones';
import { imageUrl } from '@/lib/texture';
import { rupees } from '@/lib/format';

/* ── Store / contact — PRD F-7.1 ──────────────────────────────────────────── */

export function Store() {
  const { t } = useI18n();
  const s = currentSettings();
  const mapQuery = encodeURIComponent(s.storeName + ', ' + s.storeAddress + ' ' + s.storePin);

  return (
    <>
      <TopBar back title={t('store')} />
      <main className="px-4 pt-4">
        {/* Real store photo goes here after the Phase 0 photography day. */}
        <div className="overflow-hidden rounded-lg border border-line">
          <img
            src={imageUrl({ seed: 'storefront', material: 'marble', hex: '#e4dccd', type: 'context' }, 'hero')}
            alt="Roman Marbel shopfront"
            width={520} height={260}
            className="h-[200px] w-full object-cover"
          />
        </div>

        <h1 className="mt-5 font-display text-h1">{s.storeName}</h1>
        <p className="mt-2 text-small leading-relaxed text-muted">
          Marble, granite and tiles. Come and look at the material in daylight —
          a photo on a phone is never the tile.
        </p>

        <dl className="mt-5 card divide-y divide-line px-4">
          <Line icon="pin" k="Address" v={s.storeAddress + ' — ' + s.storePin} />
          <Line icon="phone" k="Phone" v={s.ownerPhone} href={contactLinks().tel} />
          <Line icon="clock" k={t('hours')} v={s.hours} />
          <Line icon="info" k="GSTIN" v={s.gstin} />
        </dl>

        <a
          href={'https://www.google.com/maps/search/?api=1&query=' + mapQuery}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-4 w-full"
        >
          <Icon name="pin" size={18} /> {t('directions')}
        </a>

        <div className="mt-3">
          <ContactPair
            message="Hello Roman Marbel, I would like to visit the shop. What time are you open?"
            source="store"
          />
        </div>

        {/* Delivery zones — PRD §2.2 */}
        <section className="mt-10">
          <h2 className="font-display text-h2">Where we deliver</h2>
          <p className="mt-2 text-small text-muted">
            Tiles are heavy freight. We publish zones rather than promise free
            delivery everywhere, because a promise like that gets paid for in the
            rate.
          </p>
          <ul className="mt-4 space-y-3">
            {ZONES.map((z) => (
              <li key={z.id} className="card p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-h3">{z.name}</p>
                  <span className="shrink-0 text-micro text-muted">{z.radiusKm}</span>
                </div>
                <p className="mt-1 text-small text-muted">{z.coverage}</p>
                <p className="mt-2 text-small">
                  {!z.autoPricing
                    ? 'Quoted per order' + (z.minOrder ? ' · minimum ' + rupees(z.minOrder) : '')
                    : z.freeAbove
                      ? 'Free above ' + rupees(z.freeAbove) + ', otherwise ' + rupees(z.deliveryFlatCharge) + ' per trip'
                      : rupees(z.deliveryFlatCharge) + ' flat per trip' + (z.minOrder ? ' · minimum ' + rupees(z.minOrder) : '')}
                </p>
                {z.siteVisitAvailable && (
                  <p className="mt-1 flex items-center gap-1 text-micro text-success">
                    <Icon name="check" size={13} /> Site measurement available
                  </p>
                )}
              </li>
            ))}
            <li className="card border-dashed p-4">
              <p className="font-display text-h3">Outside these districts</p>
              <p className="mt-1 text-small text-muted">
                We do not auto-price delivery there, but we still want your enquiry.
                Send it and we will call you with a quote.
              </p>
            </li>
          </ul>
        </section>

        {/* F-7.4 — reviews stay empty rather than fabricated (PRD R10) */}
        <section className="mt-10">
          <h2 className="font-display text-h2">Reviews</h2>
          <div className="mt-3">
            <Callout tone="neutral">{REVIEWS_PLACEHOLDER.note}</Callout>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Line({ icon, k, v, href }: { icon: string; k: string; v: string; href?: string }) {
  const body = (
    <div className="flex items-start gap-3 py-3">
      <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <dt className="text-micro text-muted">{k}</dt>
        <dd className={'text-small ' + (href ? 'font-medium text-accent' : '')}>{v}</dd>
      </div>
    </div>
  );
  return href ? <a href={href} className="block">{body}</a> : body;
}

/* ── Policies — PRD F-7.2 ─────────────────────────────────────────────────── */

export function Policies() {
  const { t, lang } = useI18n();
  const { id } = useParams();
  const one = POLICIES.find((p) => p.id === id);

  if (one) {
    return (
      <>
        <TopBar back title={lang === 'bn' ? one.titleBn : one.titleEn} />
        <main className="px-4 pt-4">
          <p className="text-lead leading-relaxed text-muted">{one.summary}</p>
          <div className="mt-6 space-y-6">
            {one.body.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-h3">{s.heading}</h2>
                <p className="mt-2 text-small leading-relaxed text-muted">{s.text}</p>
              </section>
            ))}
          </div>
          <div className="mt-8">
            <ContactPair
              message={'Hello Roman Marbel, I have a question about your ' + one.titleEn.toLowerCase() + ' policy.'}
              source="policy"
            />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopBar back title={t('policies')} />
      <main className="px-4 pt-4">
        <p className="text-small leading-relaxed text-muted">
          The awkward parts of this trade, stated plainly. Breakage and shade
          variation cause almost every dispute, and both are avoidable if you know
          about them before the vehicle arrives.
        </p>
        <ul className="mt-5 space-y-3">
          {POLICIES.map((p) => (
            <li key={p.id}>
              <Link to={'/policies/' + p.id} className="card flex items-center gap-3 p-4 active:bg-raised">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-h3 leading-tight">
                    {lang === 'bn' ? p.titleBn : p.titleEn}
                  </p>
                  <p className="mt-1 text-small leading-snug text-muted">{p.summary}</p>
                </div>
                <Icon name="chevronRight" className="shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}

/* ── Guides — PRD F-7.5 ───────────────────────────────────────────────────── */

export function Guides() {
  const { t, lang } = useI18n();
  const { id } = useParams();
  const one = GUIDES.find((g) => g.id === id);

  if (one) {
    return (
      <>
        <TopBar back title={lang === 'bn' ? one.titleBn : one.titleEn} />
        <main className="px-4 pt-4">
          <p className="eyebrow">{one.minutes} {t('minRead')}</p>
          <p className="mt-3 text-lead leading-relaxed">{one.teaser}</p>
          <div className="mt-6 space-y-6">
            {one.body.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-h3">{s.heading}</h2>
                <p className="mt-2 text-small leading-relaxed text-muted">{s.text}</p>
              </section>
            ))}
          </div>
          <Link to="/wizard" className="btn-primary mt-8 w-full">Work out my room</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopBar back title={t('guides')} />
      <main className="px-4 pt-4">
        <p className="text-small leading-relaxed text-muted">
          Short, practical, and written to remove anxiety rather than to sell.
        </p>
        <ul className="mt-5 space-y-3">
          {GUIDES.map((g) => (
            <li key={g.id}>
              <Link to={'/guides/' + g.id} className="card flex items-center gap-3 p-4 active:bg-raised">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-h3 leading-tight">
                    {lang === 'bn' ? g.titleBn : g.titleEn}
                  </p>
                  <p className="mt-1 text-small leading-snug text-muted">{g.teaser}</p>
                  <p className="mt-1.5 text-micro text-muted">{g.minutes} {t('minRead')}</p>
                </div>
                <Icon name="chevronRight" className="shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}

/* ── Work gallery — PRD F-7.3 ─────────────────────────────────────────────── */

export function Gallery() {
  const { t } = useI18n();
  const products = allProducts();

  return (
    <>
      <TopBar back title={t('gallery')} />
      <main className="px-4 pt-4">
        <p className="text-small leading-relaxed text-muted">
          Real floors in real houses nearby, with the product tagged. Seeing a tile
          across a whole floor is a different thing from seeing a four-inch sample.
        </p>

        <Callout tone="neutral">
          These are placeholder renders. Real customer photographs replace them
          after the Phase 0 photography day — with the householder's permission,
          which the shop asks for in person.
        </Callout>

        <ul className="mt-5 grid grid-cols-2 gap-3">
          {GALLERY.map((g) => {
            const p = products.find((x) => x.slug === g.productSlug);
            return (
              <li key={g.id} className="card overflow-hidden">
                <img
                  src={imageUrl({
                    seed: 'gal-' + g.id,
                    material: p?.material ?? 'vitrified',
                    hex: p?.colourHexPrimary ?? '#ddd7cc',
                    type: 'context',
                    sizeMm: p?.sizeMm,
                  }, 'thumb')}
                  alt={g.room + ' in ' + g.place}
                  width={200} height={150}
                  loading="lazy" decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-3">
                  <p className="text-small font-semibold leading-snug">{g.room}</p>
                  <p className="text-micro text-muted">{g.place} · {g.sqft} sq ft</p>
                  <p className="mt-1.5 text-micro leading-snug text-muted">{g.note}</p>
                  {p && (
                    <Link
                      to={'/product/' + p.slug}
                      className="mt-2 inline-block text-micro font-semibold text-accent"
                    >
                      {p.nameEn} →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </>
  );
}
