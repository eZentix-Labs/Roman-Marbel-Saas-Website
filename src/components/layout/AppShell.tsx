import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import { currentSettings } from '@/api/client';
import { track } from '@/lib/analytics';

/**
 * PRD §10.2 — mobile web, designed at 360–430px. Anything wider gets the same
 * column centred on a quiet field rather than a reflowed desktop layout, which
 * is what "desktop is a widened variant, never the design target" means in
 * practice.
 */

export function contactLinks() {
  const s = currentSettings();
  return {
    tel: 'tel:' + s.ownerPhone,
    wa: (text: string) =>
      'https://wa.me/' + s.ownerWhatsapp + '?text=' + encodeURIComponent(text),
  };
}

/**
 * iOS navigation bar.
 *
 * Two behaviours borrowed from UIKit, because they are what make a web app stop
 * feeling like a web page:
 *
 *  1. The bar is a translucent material, and its hairline only appears once
 *     content has scrolled under it. A permanently drawn separator over a
 *     not-yet-scrolled view is the commonest tell of a web app imitating iOS.
 *  2. Back is a chevron plus a label, left-aligned, with the screen title
 *     centred — not a lone arrow with a left-aligned title.
 *
 * `large` renders the large-title variant used on root screens, which collapses
 * into the inline title as the page scrolls.
 */
export function TopBar({
  title, back, right, subtitle, large, backLabel,
}: {
  title?: string; back?: boolean; right?: ReactNode; subtitle?: string;
  large?: boolean; backLabel?: string;
}) {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > (large ? 44 : 4));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [large]);

  const langBtn = (
    <button
      onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
      className="grid h-11 min-w-[44px] place-items-center rounded-pill px-2 text-small font-semibold text-accent"
      aria-label={lang === 'en' ? 'Switch to Bengali' : 'Switch to English'}
    >
      {lang === 'en' ? 'বাং' : 'EN'}
    </button>
  );

  return (
    <header
      className={'sticky top-0 z-20 transition-shadow duration-200 ' + (scrolled ? 'glass' : '')}
      style={{ paddingTop: 'var(--sat)' }}
    >
      <div className="relative flex items-center gap-1 px-2" style={{ height: 'var(--nav-h)' }}>
        {/* Leading */}
        <div className="z-10 flex min-w-0 items-center">
          {back ? (
            <button
              onClick={() => navigate(-1)}
              aria-label={t('back')}
              className="-ml-1 flex items-center gap-0.5 rounded-pill pl-1 pr-2 text-accent"
            >
              <Icon name="chevronLeft" size={24} />
              <span className="max-w-[92px] truncate text-[17px] leading-none">
                {backLabel ?? t('back')}
              </span>
            </button>
          ) : !large ? (
            <Link to="/" className="pl-2 text-[17px] font-semibold" aria-label={t('appName')}>
              Roman Marbel
            </Link>
          ) : null}
        </div>

        {/* Centred title — the iOS convention, and it stays centred regardless
            of how wide the leading and trailing controls are. */}
        {back && title && (
          <div
            className={
              'pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center ' +
              'px-24 transition-opacity duration-200 ' +
              (large && !scrolled ? 'opacity-0' : 'opacity-100')
            }
            style={{ height: 'var(--nav-h)' }}
          >
            <h1 className="max-w-full truncate text-[17px] font-semibold leading-tight">{title}</h1>
            {subtitle && <p className="max-w-full truncate text-[11px] text-muted">{subtitle}</p>}
          </div>
        )}

        {/* Trailing */}
        <div className="z-10 ml-auto flex items-center gap-0.5">
          {right}
          {langBtn}
        </div>
      </div>

      {scrolled && <div className="h-[0.5px] bg-line" />}
    </header>
  );
}

/**
 * The iOS large title. Sits below the nav bar on a root screen and scrolls away
 * with the content, handing the title over to the bar as it goes.
 */
export function LargeTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="px-4 pb-1 pt-1">
      <h1 className="font-display text-display font-bold">{children}</h1>
      {sub && <p className="mt-1 text-small text-muted">{sub}</p>}
    </div>
  );
}

const TABS = [
  { to: '/', icon: 'home', key: 'homeTab', labelEn: 'Home', labelBn: 'হোম', end: true },
  { to: '/catalogue', icon: 'grid', key: 'catTab', labelEn: 'Catalogue', labelBn: 'ক্যাটালগ' },
  { to: '/wizard', icon: 'calculator', key: 'calcTab', labelEn: 'Estimate', labelBn: 'হিসাব' },
  { to: '/orders', icon: 'truck', key: 'ordTab', labelEn: 'Orders', labelBn: 'অর্ডার' },
  { to: '/store', icon: 'pin', key: 'storeTab', labelEn: 'Shop', labelBn: 'দোকান' },
] as const;

export function BottomNav() {
  const { lang } = useI18n();
  const { house } = useApp();
  return (
    /* iOS tab bar: translucent material, a hairline on top, 10px labels under
       the glyph, and the whole thing sitting above the home indicator. */
    <nav
      className="glass hairline-t fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app"
      style={{ paddingBottom: 'var(--sab)' }}
      aria-label="Main"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={'end' in tab ? tab.end : false}
              className={({ isActive }) =>
                'relative flex flex-col items-center gap-[3px] pb-1.5 pt-2 transition-colors duration-150 ' +
                (isActive ? 'text-accent' : 'text-muted')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={tab.icon} size={25} strokeWidth={isActive ? 2.1 : 1.7} />
                  <span className="text-[10px] font-medium leading-none tracking-tight">
                    {lang === 'bn' ? tab.labelBn : tab.labelEn}
                  </span>
                  {tab.to === '/wizard' && house.length > 0 && (
                    <span
                      className="absolute right-[20%] top-1 grid h-[17px] min-w-[17px] place-items-center rounded-pill bg-danger px-1 text-[11px] font-semibold leading-none text-white"
                      aria-label={house.length + ' areas saved'}
                    >
                      {house.length}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * PRD §9.7 integration failure handling — the WhatsApp button is never shown
 * alone. If the customer has no WhatsApp, Call is right beside it.
 */
export function ContactPair({ message, source }: { message: string; source: string }) {
  const { t } = useI18n();
  const links = contactLinks();
  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={links.wa(message)}
        target="_blank"
        rel="noreferrer"
        onClick={() => track('whatsapp_click', { source })}
        className="btn-primary"
      >
        {t('whatsapp')}
      </a>
      <a
        href={links.tel}
        onClick={() => track('call_click', { source })}
        className="btn-secondary"
      >
        <Icon name="phone" size={18} />
        {t('call')}
      </a>
    </div>
  );
}

/**
 * Floating call/WhatsApp pair — PRD §5 wants contact always in reach on the
 * home screen.
 *
 * Two compact circles rather than a labelled pill, and hidden until the hero
 * has scrolled away: at rest it would sit on top of the two doors, and covering
 * the primary CTA to advertise a secondary one is the wrong trade.
 */
export function FloatingContact({ message }: { message: string }) {
  const links = contactLinks();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex w-full max-w-app justify-end gap-2 px-4 transition-opacity duration-200"
      style={{ bottom: 'calc(72px + var(--sab))', opacity: shown ? 1 : 0 }}
      aria-hidden={!shown}
    >
      <a
        href={links.tel}
        onClick={() => track('call_click', { source: 'floating' })}
        aria-label="Call the shop"
        tabIndex={shown ? 0 : -1}
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-pill border border-line bg-surface/95 text-hi shadow-card backdrop-blur"
      >
        <Icon name="phone" />
      </a>
      <a
        href={links.wa(message)}
        target="_blank"
        rel="noreferrer"
        onClick={() => track('whatsapp_click', { source: 'floating' })}
        aria-label="Message the shop on WhatsApp"
        tabIndex={shown ? 0 : -1}
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-pill bg-accent text-white shadow-card"
      >
        <Icon name="chat" />
      </a>
    </div>
  );
}

export function Footer() {
  const s = currentSettings();
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return (
    <footer className="mt-12 line-t px-4 pt-8 text-small text-muted">
      <p className="font-display text-h3 text-hi">Roman Marbel</p>
      <p className="mt-1 leading-relaxed">
        {s.storeAddress} — {s.storePin}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        <Link to="/catalogue" className="inline-link underline-offset-2 hover:underline">Catalogue</Link>
        <Link to="/wizard" className="inline-link underline-offset-2 hover:underline">Estimate calculator</Link>
        <Link to="/orders" className="inline-link underline-offset-2 hover:underline">Track order</Link>
        <Link to="/store" className="inline-link underline-offset-2 hover:underline">Visit the shop</Link>
        <Link to="/guides" className="inline-link underline-offset-2 hover:underline">Guides</Link>
        <Link to="/gallery" className="inline-link underline-offset-2 hover:underline">Work gallery</Link>
        <Link to="/policies" className="inline-link underline-offset-2 hover:underline">Policies</Link>
        <Link to="/admin" className="inline-link underline-offset-2 hover:underline">Shop login</Link>
      </div>
      <div className="mt-6 h-px bg-line" />
      <p className="mt-4 text-micro leading-relaxed">
        GSTIN {s.gstin} · © 2026 Roman Marbel.
      </p>
      <p className="mt-1 text-micro leading-relaxed">{s.rateValidityText}</p>
      <div style={{ height: 'calc(84px + var(--sab))' }} />
    </footer>
  );
}
