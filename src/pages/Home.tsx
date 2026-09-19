import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TopBar, FloatingContact, Footer } from '@/components/layout/AppShell';
import { ProductCard } from '@/components/catalogue/ProductCard';
import { Callout, Icon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import { getProducts, lookupZone, currentSettings } from '@/api/client';
import { ROOMS } from '@/api/mock/categories';
import { ZONE_D_COPY } from '@/api/mock/zones';
import type { Product, Zone } from '@/types';
import { imageUrl } from '@/lib/texture';
import { PRODUCTS } from '@/api/mock/products';

/**
 * PRD §5 — the home screen offers exactly two doors. Not a hero carousel, not a
 * banner of offers. Each door is a large tap target, with call/WhatsApp always
 * in reach.
 *
 * The PIN gate sits above the doors because PRD §2.2 wants zone resolved early:
 * it decides delivery charge, site-measurement availability, and whether the
 * estimate can be auto-priced at all.
 */
export default function Home() {
  const { t, lang, pick } = useI18n();
  const { pin, setPin } = useApp();
  const navigate = useNavigate();
  const settings = currentSettings();

  const [featured, setFeatured] = useState<Product[]>([]);
  const [pinDraft, setPinDraft] = useState(pin);
  const [zone, setZone] = useState<Zone | null>(null);
  const [zoneChecked, setZoneChecked] = useState(false);

  useEffect(() => {
    getProducts({ pageSize: 4, sort: 'relevance' }).then((r) => {
      if (r.data) setFeatured(r.data.items.filter((p) => p.isFeatured).slice(0, 4));
    });
  }, []);

  useEffect(() => {
    if (pin.length === 6) checkPin(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkPin(value: string) {
    const r = await lookupZone(value);
    setZone(r.data ?? null);
    setZoneChecked(true);
    setPin(value);
  }

  const heroProduct = PRODUCTS.find((p) => p.slug === 'carrara-white-vitrified')!;

  return (
    <>
      <TopBar />

      <main className="px-4 pt-5">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <p className="eyebrow">{t('tagline')}</p>
        <h1 className="mt-3 font-display text-display">
          {t('homeHeadline')}
        </h1>
        <p className="mt-3 text-lead text-muted">{t('homeSub')}</p>

        {/* PIN gate — PRD §2.2 */}
        <div className="mt-5 rounded border border-line bg-surface p-3">
          <label htmlFor="pin" className="eyebrow">{t('deliveryPin')}</label>
          <div className="mt-2 flex gap-2">
            <input
              id="pin"
              inputMode="numeric"
              maxLength={6}
              placeholder="713407"
              value={pinDraft}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPinDraft(v);
                setZoneChecked(false);
                if (v.length === 6) checkPin(v);
              }}
              className="field flex-1 font-display text-h3 tracking-wider"
            />
            <Link
              to="/wizard"
              className="btn-primary shrink-0 px-5 text-small"
              aria-label={t('checkPin')}
            >
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>

          {zoneChecked && zone && (
            <p className="mt-2 flex items-start gap-1.5 text-micro text-success">
              <Icon name="check" size={14} className="mt-0.5 shrink-0" />
              <span>
                <strong>{zone.name}</strong> — {zone.label}.{' '}
                {zone.autoPricing
                  ? zone.freeAbove
                    ? 'Free delivery above ₹' + zone.freeAbove.toLocaleString('en-IN') + '.'
                    : 'Flat ₹' + zone.deliveryFlatCharge.toLocaleString('en-IN') + ' per trip.'
                  : 'Delivery quoted per order.'}
                {zone.siteVisitAvailable && ' Site measurement available.'}
              </span>
            </p>
          )}
          {zoneChecked && !zone && pinDraft.length === 6 && (
            <p className="mt-2 flex items-start gap-1.5 text-micro text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              <span>{ZONE_D_COPY.body}</span>
            </p>
          )}
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-micro text-muted">
          {[t('tick1'), t('tick2'), t('tick3')].map((x) => (
            <li key={x} className="flex items-center gap-1">
              <Icon name="check" size={13} className="text-success" />{x}
            </li>
          ))}
        </ul>

        {/* ── The two doors ────────────────────────────────────────────── */}
        <div className="mt-8 space-y-3">
          <Door
            to="/catalogue"
            title={t('doorABig')}
            sub={t('doorASub')}
            image={imageUrl({
              seed: 'door-a', material: heroProduct.material,
              hex: heroProduct.colourHexPrimary, type: 'flat',
            }, 'hero')}
          />
          <Door
            to="/wizard"
            title={t('doorBBig')}
            sub={t('doorBSub')}
            image={imageUrl({
              seed: 'door-b', material: 'marble', hex: '#d8c7a8', type: 'context',
            }, 'hero')}
            accent
          />
        </div>

        {/* ── Shop by space ────────────────────────────────────────────── */}
        <section className="mt-12">
          <p className="eyebrow">{t('shopBySpace')}</p>
          <h2 className="mt-2 font-display text-h2">{t('shopBySpaceSub')}</h2>
          <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ROOMS.map((r) => (
              <Link
                key={r.id}
                to={'/catalogue?room=' + r.id}
                className="card w-[152px] shrink-0 overflow-hidden active:bg-raised"
              >
                <div className="aspect-[4/3] bg-raised">
                  <img
                    src={imageUrl({
                      seed: 'room-' + r.id,
                      material: r.preview.material,
                      hex: r.preview.hex,
                      type: 'context',
                    }, 'thumb')}
                    alt="" width={152} height={114}
                    loading="lazy" decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-small font-semibold leading-snug">
                    {lang === 'bn' ? r.labelBn : r.labelEn}
                  </p>
                  <p className="mt-1 text-micro text-muted">{r.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Trust strip ──────────────────────────────────────────────────
             Every figure here is either a product fact or a stated commitment.
             PRD R10 rules out invented activity numbers, so there is no "people
             viewing" counter and no "150+ enquiries" claim — that figure is a
             month-12 target in PRD §3.3, not something the shop can evidence
             today.                                                          */}
        <section className="mt-12 grid grid-cols-2 gap-x-4 gap-y-6 rounded border border-line bg-raised/50 p-5">
          <Stat figure="30 sec" label={t('statSpeed')} />
          <Stat figure="±8%" label={t('statAccuracy')} />
          <Stat figure="2" label={t('statDistricts')} />
          <Stat figure={t('statSameDay')} label={t('statReply')} />
        </section>

        {/* ── Featured ─────────────────────────────────────────────────── */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">{t('inStockNow')}</p>
              <h2 className="mt-2 font-display text-h2">{t('popularWeek')}</h2>
            </div>
            <Link to="/catalogue" className="shrink-0 pb-1 text-small font-semibold text-accent">
              {t('viewCatalogue')} →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 2} />)}
          </div>
        </section>

        {/* ── Calculator CTA ───────────────────────────────────────────── */}
        <section className="mt-12 rounded-lg bg-deep p-6 text-hi">
          <h2 className="font-display text-h2">{t('ctaTitle')}</h2>
          <p className="mt-2 text-small leading-relaxed text-hi/75">{t('ctaBody')}</p>
          <Link
            to="/wizard"
            className="btn mt-5 w-full bg-ink text-hi active:bg-raised"
          >
            {t('openCalculator')}
          </Link>
        </section>

        {/* ── Honest note ──────────────────────────────────────────────── */}
        <div className="mt-8">
          <Callout tone="neutral" title={t('honestTitle')}>
            {t('honestBody')}
            <p className="mt-2 text-micro">{settings.rateValidityText}</p>
          </Callout>
        </div>
      </main>

      <Footer />
      <FloatingContact message={'Hello Roman Marbel, I would like to ask about tiles.'} />
    </>
  );
}

function Door({
  to, title, sub, image, accent,
}: { to: string; title: string; sub: string; image: string; accent?: boolean }) {
  return (
    <Link
      to={to}
      className={
        'relative flex items-center gap-4 overflow-hidden rounded-lg border p-4 transition-colors ' +
        (accent
          ? 'border-accent/30 bg-accent/5 active:bg-accent/10'
          : 'border-line bg-surface active:bg-raised')
      }
      style={{ minHeight: 104 }}
    >
      <img
        src={image} alt="" width={72} height={72}
        loading="eager" decoding="async"
        className="h-[72px] w-[72px] shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-h3 leading-tight">{title}</p>
        <p className="mt-1 text-small leading-snug text-muted">{sub}</p>
      </div>
      <Icon name="chevronRight" className="shrink-0 text-muted" />
    </Link>
  );
}

function Stat({ figure, label }: { figure: string; label: string }) {
  return (
    <div>
      <p className="font-display text-figure leading-none">{figure}</p>
      <p className="mt-2 text-micro leading-snug text-muted">{label}</p>
    </div>
  );
}
