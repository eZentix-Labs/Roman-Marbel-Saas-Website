import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TopBar, Footer, contactLinks } from '@/components/layout/AppShell';
import { ActionBar, BarSpacer, Callout, Icon, Segmented, TextField } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import {
  DEMO_OTP, getEstimate, lookupZone, requestOtp, submitEnquiry, verifyOtp,
} from '@/api/client';
import { normalisePhone, rupees } from '@/lib/format';
import { track } from '@/lib/analytics';
import type { Enquiry as Enq, Estimate as Est, Zone } from '@/types';

/**
 * PRD F-6.1 — name, phone, PIN, preferred contact time. Nothing else. No email,
 * no account, no address at this stage. Every extra field here costs leads, and
 * the one thing the owner needs is a number that answers.
 *
 * F-6.2 — phone OTP before the enquiry reaches the owner's phone, because
 * without it the inbox fills with junk and stops being read.
 */
export default function Enquiry() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pin, setPin } = useApp();

  const refNo = params.get('ref');
  const typeParam = (params.get('type') as Enq['type'] | null) ?? 'standard';

  const [estimate, setEstimate] = useState<Est | null>(null);
  const [type, setType] = useState<Enq['type']>(typeParam);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pinDraft, setPinDraft] = useState(pin || '');
  const [zone, setZone] = useState<Zone | null>(null);
  const [when, setWhen] = useState('Anytime');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (refNo) getEstimate(refNo).then((r) => r.data && setEstimate(r.data));
  }, [refNo]);

  useEffect(() => {
    if (pinDraft.length === 6) lookupZone(pinDraft).then((r) => setZone(r.data ?? null));
    else setZone(null);
  }, [pinDraft]);

  const summary = useMemo(() => {
    if (!estimate) return { products: '—', quantity: '—', value: 0 };
    return {
      products: estimate.lines.map((l) => l.productName).join(', '),
      quantity: estimate.lines
        .map((l) => (l.boxes != null ? l.boxes + ' boxes' : l.actualSqftPurchased.toFixed(0) + ' sq ft'))
        .join(' + '),
      value: estimate.total,
    };
  }, [estimate]);

  async function sendCode() {
    const next: Record<string, string> = {};
    const ten = normalisePhone(phone);
    if (!name.trim()) next.name = 'Please tell us your name.';
    if (!ten) next.phone = 'Enter a 10-digit mobile number.';
    if (pinDraft.length !== 6) next.pin = 'Enter your 6-digit PIN code.';
    // N-4.6 / TRD §13.1 — explicit consent before a phone number is collected.
    if (!consent) next.consent = 'Please tick the box so we may call you back.';
    setErr(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const r = await requestOtp(ten!);
    setBusy(false);
    if (r.error) return setErr({ phone: r.error.message });
    setStage('otp');
  }

  async function submit() {
    const ten = normalisePhone(phone)!;
    setBusy(true);
    const v = await verifyOtp(ten, code);
    if (v.error) { setBusy(false); return setErr({ code: v.error.message }); }

    const r = await submitEnquiry({
      estimateRef: estimate?.referenceNo ?? null,
      name, phone: ten, pinCode: pinDraft,
      preferredContactTime: when,
      message,
      type,
      estimatedValue: summary.value,
      productSummary: summary.products,
      quantitySummary: summary.quantity,
      sourcePage: estimate?.source ?? 'browse',
      verifiedPhoneToken: v.data!.token,
    });
    setBusy(false);
    if (r.error) return setErr({ code: r.error.message });

    setPin(pinDraft);
    track('enquiry_submit', { type, value: Math.round(summary.value), zone: zone?.id ?? 'none' });

    // TRD §9.1 — the enquiry row is already written. The WhatsApp hand-off is
    // a convenience on top of it, never the thing the lead depends on.
    navigate('/confirmation', {
      state: { enquiry: r.data, estimate, zone: zone?.name ?? null },
      replace: true,
    });
  }

  const isBulk = type === 'bulk';

  return (
    <>
      <TopBar back title={t('enquiryTitle')} />

      <main className="px-4 pt-4">
        {/* What is being sent */}
        {estimate ? (
          <div className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">{t('yourReference')}</p>
                <p className="font-display text-h3">{estimate.referenceNo}</p>
              </div>
              <p className="shrink-0 font-display text-h3">{rupees(estimate.total)}</p>
            </div>
            <div className="mt-3 border-t border-line pt-3 text-small text-muted">
              <p className="line-clamp-2">{summary.products}</p>
              <p className="mt-0.5">{summary.quantity}</p>
            </div>
          </div>
        ) : (
          <Callout tone="neutral">
            No estimate attached. That is fine — tell us what you need and we will
            work it out on the phone.{' '}
            <Link to="/wizard" className="inline-link font-medium underline">
              Or build one first.
            </Link>
          </Callout>
        )}

        {/* F-6.5 — bulk/project enquiries route separately with no auto-pricing */}
        <div className="mt-5">
          <Segmented
            ariaLabel="Enquiry type"
            value={isBulk ? 'bulk' : 'standard'}
            onChange={(v) => setType(v === 'bulk' ? 'bulk' : 'standard')}
            options={[
              { id: 'standard', label: 'For my home' },
              { id: 'bulk', label: 'Bulk / project' },
            ]}
          />
        </div>

        {isBulk && (
          <div className="mt-3">
            <Callout tone="neutral" title="Project pricing is negotiated">
              Bulk and project orders are not auto-priced. This goes straight to the
              owner, who will discuss rate, batch consistency across the whole
              project, and payment stages with you directly.
            </Callout>
          </div>
        )}

        {stage === 'form' ? (
          <div className="mt-5 space-y-4">
            <TextField
              label={t('yourName')} value={name} onChange={setName}
              error={err.name} autoComplete="name" placeholder="Your name"
            />
            <TextField
              label={t('phoneNumber')} value={phone} onChange={setPhone}
              error={err.phone} inputMode="tel" autoComplete="tel"
              placeholder="98xxxxxxxx"
              hint="We will send a 6-digit code to confirm this is you."
            />
            <div>
              <TextField
                label={t('pinCode')} value={pinDraft}
                onChange={(v) => setPinDraft(v.replace(/\D/g, '').slice(0, 6))}
                error={err.pin} inputMode="numeric" placeholder="713407"
              />
              {zone && (
                <p className="mt-1 text-micro text-success">
                  {zone.name} — {zone.label}
                  {zone.siteVisitAvailable && ' · site measurement available'}
                </p>
              )}
              {!zone && pinDraft.length === 6 && (
                <p className="mt-1 text-micro text-muted">
                  Outside our usual delivery districts — we will still call you with a quote.
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-small font-medium text-muted">{t('contactTime')}</p>
              <div className="flex flex-wrap gap-2">
                {[t('anytime'), t('morning'), t('afternoon'), t('evening')].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWhen(w)}
                    className={'chip ' + (when === w ? 'chip-on' : '')}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* F-6.4 — site measurement, offered only where the zone supports it */}
            {zone?.siteVisitAvailable && !isBulk && (
              <label className="flex items-start gap-3 rounded-sm border border-line bg-surface p-3">
                <input
                  type="checkbox"
                  checked={type === 'site_visit'}
                  onChange={(e) => setType(e.target.checked ? 'site_visit' : 'standard')}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#4d7cfe]"
                />
                <span className="text-small leading-snug">
                  <span className="font-medium">{t('siteMeasurement')}</span>
                  <span className="mt-0.5 block text-micro text-muted">
                    Someone comes and measures, so the quantity is exact rather than estimated.
                  </span>
                </span>
              </label>
            )}

            <div>
              <label htmlFor="msg" className="mb-1 block text-small font-medium text-muted">
                Anything else? <span className="font-normal">(optional)</span>
              </label>
              <textarea
                id="msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isBulk
                  ? 'How many flats, what stage the project is at, when you need delivery…'
                  : 'Floor level, access to the site, when you need it…'}
                className="field resize-none"
              />
            </div>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#4d7cfe]"
                aria-invalid={Boolean(err.consent)}
              />
              <span className="text-small leading-relaxed">
                {t('consent')}{' '}
                <Link to="/policies/privacy" className="inline-link underline underline-offset-2">
                  Privacy
                </Link>
              </span>
            </label>
            {err.consent && <p className="-mt-2 text-micro text-danger">{err.consent}</p>}

            <BarSpacer />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="card p-4 text-center">
              <Icon name="phone" className="mx-auto text-accent" />
              <p className="mt-2 font-display text-h3">Confirm your number</p>
              <p className="mt-1 text-small text-muted">
                Code sent to {normalisePhone(phone)}
              </p>
            </div>
            <TextField
              label={t('enterOtp')} value={code}
              onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              error={err.code} inputMode="numeric" autoFocus
              className="field text-center font-display text-h2 tracking-[0.4em]"
            />
            <Callout tone="warning" title="Demo build">
              No SMS is sent from this frontend — OTP delivery needs MSG91 or
              Fast2SMS with a DLT-registered template (TRD §9.2). Use{' '}
              <strong>{DEMO_OTP}</strong> to continue.
            </Callout>
            <button
              onClick={() => { setStage('form'); setCode(''); setErr({}); }}
              className="text-small text-accent underline underline-offset-2"
              style={{ minHeight: 44 }}
            >
              Change my number
            </button>
            <BarSpacer />
          </div>
        )}
      </main>

      <ActionBar>
        {stage === 'form' ? (
          <button onClick={sendCode} disabled={busy} className="btn-primary w-full">
            {busy ? t('loading') : t('sendOtp')}
          </button>
        ) : (
          <button onClick={submit} disabled={busy || code.length !== 6} className="btn-primary w-full">
            {busy ? t('loading') : t('submitEnquiry')}
          </button>
        )}
        <p className="mt-2 text-center text-micro text-muted">
          Or just{' '}
          <a href={contactLinks().tel} className="inline-link font-medium text-accent underline">
            call the shop
          </a>{' '}
          — a person answers.
        </p>
      </ActionBar>

      <Footer />
    </>
  );
}
