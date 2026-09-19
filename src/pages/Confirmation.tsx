import { Link, Navigate, useLocation } from 'react-router-dom';
import { TopBar, Footer, ContactPair } from '@/components/layout/AppShell';
import { Callout, Icon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { currentSettings } from '@/api/client';
import { prettyPhone, rupees } from '@/lib/format';
import type { Enquiry, Estimate } from '@/types';

/**
 * PRD §10.5 screen 10 — reference number and what happens next.
 *
 * The reference number matters more than it looks: it is what the customer
 * quotes at the counter (F-5.8) and what the owner searches for in the admin
 * panel, which is how a phone conversation starts at selection rather than at
 * "which one were you looking at?".
 */
export default function Confirmation() {
  const { t } = useI18n();
  const { state } = useLocation() as {
    state: { enquiry: Enquiry; estimate: Estimate | null; zone: string | null } | null;
  };
  const settings = currentSettings();

  if (!state?.enquiry) return <Navigate to="/" replace />;

  const { enquiry, estimate } = state;

  const waText = [
    'Hello Roman Marbel,',
    estimate ? 'My estimate reference is ' + estimate.referenceNo + '.' : '',
    enquiry.productSummary !== '—' ? 'Product: ' + enquiry.productSummary : '',
    enquiry.quantitySummary !== '—' ? 'Quantity: ' + enquiry.quantitySummary : '',
    estimate ? 'Estimated total: ' + rupees(estimate.total) : '',
    'Name: ' + enquiry.name + ', PIN ' + enquiry.pinCode + '.',
    enquiry.message ? 'Note: ' + enquiry.message : '',
  ].filter(Boolean).join('\n');

  return (
    <>
      <TopBar back title={t('confirmTitle')} />

      <main className="px-4 pt-6">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-pill bg-success/10 text-success">
            <Icon name="check" size={30} />
          </span>
          <h1 className="mt-4 font-display text-h1">{t('confirmTitle')}</h1>
          <p className="mx-auto mt-2 max-w-[32ch] text-small leading-relaxed text-muted">
            Your enquiry is with the shop. Someone will call{' '}
            {prettyPhone(enquiry.phone)}
            {enquiry.preferredContactTime !== 'Anytime'
              ? ' in the ' + enquiry.preferredContactTime.toLowerCase()
              : ''}.
          </p>
        </div>

        {estimate && (
          <div className="mt-6 rounded-lg border border-line bg-surface p-5 text-center">
            <p className="eyebrow">{t('yourReference')}</p>
            <p className="mt-1 font-display text-display tracking-wide">{estimate.referenceNo}</p>
            <p className="mt-2 text-small text-muted">
              Quote this at the counter. Saved on this phone for 30 days.
            </p>
            <Link
              to={'/estimate/' + estimate.referenceNo}
              className="btn-secondary mt-4 w-full"
            >
              View the estimate
            </Link>
          </div>
        )}

        {/* WhatsApp hand-off. TRD §9.1 — the enquiry is already recorded; this
            is a convenience so the customer has the thread on their own phone. */}
        <section className="mt-6">
          <p className="mb-2 text-small text-muted">
            Send it to yourself on WhatsApp too, so you have the thread:
          </p>
          <ContactPair message={waText} source="confirmation" />
        </section>

        <section className="mt-8">
          <h2 className="eyebrow">{t('whatHappensNext')}</h2>
          <ol className="mt-3 space-y-4">
            {[
              {
                title: 'We call you',
                body: enquiry.type === 'bulk'
                  ? 'The owner calls personally to discuss rate, batch consistency across the project, and payment stages.'
                  : 'Usually the same day. We confirm the rate, the quantity, and what delivery to your PIN actually costs.',
              },
              {
                title: enquiry.type === 'site_visit' ? 'We measure the site' : 'You come and see it',
                body: enquiry.type === 'site_visit'
                  ? 'Someone visits and measures, so the quantity is exact rather than estimated.'
                  : 'Come to the shop and look at the material in daylight. Ask for a sample piece to take home — a photo on a phone is not the tile.',
              },
              {
                title: 'Order and delivery',
                body: 'Confirm the quantity, pay an advance if you want to lock the lot, and we deliver to your gate.',
              },
            ].map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-accent text-micro font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-small font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-small leading-relaxed text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 space-y-3">
          <Callout tone="neutral" title="Before you buy">
            Read the{' '}
            <Link to="/policies/shade" className="inline-link font-medium underline">
              shade variation
            </Link>{' '}
            and{' '}
            <Link to="/policies/breakage" className="inline-link font-medium underline">
              breakage
            </Link>{' '}
            pages. They cover the two things that cause almost every dispute in this
            trade, and both are easy to avoid if you know about them in advance.
          </Callout>
        </div>

        <div className="mt-6 space-y-2">
          <Link to="/catalogue" className="btn-secondary w-full">Keep browsing</Link>
          <Link to="/orders" className="btn-ghost w-full text-small text-muted">
            {t('trackOrder')}
          </Link>
        </div>

        <p className="mt-6 text-center text-micro leading-relaxed text-muted">
          {settings.storeName} · {settings.storeAddress} — {settings.storePin}
        </p>
      </main>

      <Footer />
    </>
  );
}
