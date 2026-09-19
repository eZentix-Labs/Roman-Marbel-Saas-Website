import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar, Footer, LargeTitle, contactLinks } from '@/components/layout/AppShell';
import { Callout, Icon, Segmented, TextField } from '@/components/ui';
import { useI18n } from '@/i18n';
import { DEMO_OTP, lookupOrders, requestOtp, verifyOtp } from '@/api/client';
import { ORDER_STEPS } from '@/api/mock/orders';
import { imageUrl } from '@/lib/texture';
import { normalisePhone, rupees, shortDate } from '@/lib/format';
import { track } from '@/lib/analytics';
import type { Order } from '@/types';

/**
 * PRD F-9.1–F-9.6 — order tracking reached without a full account. A phone
 * number plus OTP is enough; the PRD's non-goal list is explicit that nobody
 * should be made to create an account on a once-in-15-years purchase.
 *
 * Demo numbers: 9876543210 (two orders) or 9123456780 (one). OTP 123456.
 */
export default function Orders() {
  const { t, lang } = useI18n();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'otp' | 'list'>('phone');
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function sendCode() {
    const ten = normalisePhone(phone);
    if (!ten) return setErr('Enter a 10-digit mobile number.');
    setErr(''); setBusy(true);
    const r = await requestOtp(ten);
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    setStage('otp');
  }

  async function confirm() {
    const ten = normalisePhone(phone)!;
    setBusy(true);
    const v = await verifyOtp(ten, code);
    if (v.error) { setBusy(false); return setErr(v.error.message); }
    const r = await lookupOrders(ten, v.data!.token);
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    setOrders(r.data!);
    setStage('list');
    track('order_lookup', { count: r.data!.length });
  }

  const active = orders.filter((o) => o.deliveryStatus !== 'delivered' && o.deliveryStatus !== 'cancelled');
  const completed = orders.filter((o) => o.deliveryStatus === 'delivered' || o.deliveryStatus === 'cancelled');
  const shown = tab === 'active' ? active : completed;

  return (
    <>
      <TopBar back title={t('orders')} />

      <LargeTitle>{t('orders')}</LargeTitle>

      <main className="px-4 pt-2">
        {stage !== 'list' && (
          <>
            <p className="text-small leading-relaxed text-muted">
              No account needed. Enter the mobile number you gave at the shop and
              we will send you a code.
            </p>

            <div className="mt-5 space-y-4">
              {stage === 'phone' ? (
                <>
                  <TextField
                    label={t('phoneNumber')} value={phone} onChange={setPhone}
                    inputMode="tel" autoComplete="tel" placeholder="98xxxxxxxx"
                    error={err || undefined}
                  />
                  <button onClick={sendCode} disabled={busy} className="btn-primary w-full">
                    {busy ? t('loading') : t('sendOtp')}
                  </button>
                </>
              ) : (
                <>
                  <TextField
                    label={t('enterOtp')} value={code}
                    onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric" autoFocus error={err || undefined}
                    className="field text-center font-display text-h2 tracking-[0.4em]"
                  />
                  <button
                    onClick={confirm}
                    disabled={busy || code.length !== 6}
                    className="btn-primary w-full"
                  >
                    {busy ? t('loading') : t('verify')}
                  </button>
                  <button
                    onClick={() => { setStage('phone'); setCode(''); setErr(''); }}
                    className="text-small text-accent underline"
                    style={{ minHeight: 44 }}
                  >
                    Change number
                  </button>
                </>
              )}
            </div>

            <div className="mt-6">
              <Callout tone="warning" title="Demo build">
                No SMS is sent from this frontend. Try <strong>9876543210</strong> with
                code <strong>{DEMO_OTP}</strong> to see a live order, or{' '}
                <strong>9123456780</strong> for a contractor order.
              </Callout>
            </div>
          </>
        )}

        {stage === 'list' && (
          <>
            <Segmented
              ariaLabel="Order status"
              value={tab}
              onChange={setTab}
              options={[
                { id: 'active' as const, label: t('active') + ' (' + active.length + ')' },
                { id: 'completed' as const, label: t('completed') + ' (' + completed.length + ')' },
              ]}
            />

            {shown.length === 0 ? (
              <p className="py-16 text-center text-small text-muted">
                Nothing here.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {shown.map((o) => {
                  const expanded = open === o.id;
                  const reached = o.timeline.filter((e) => e.occurredAt).length;
                  return (
                    <li key={o.id} className="card overflow-hidden">
                      {/* F-9.2 — collapsed by default, everything at a glance */}
                      <button
                        onClick={() => setOpen(expanded ? null : o.id)}
                        aria-expanded={expanded}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-display text-h3 leading-tight">{o.orderCode}</p>
                            <p className="mt-0.5 line-clamp-1 text-small text-muted">
                              {o.lines.map((l) => l.productName).join(', ')}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-display text-base font-semibold">{rupees(o.finalTotal)}</p>
                            <Icon
                              name="chevron"
                              size={16}
                              className={'ml-auto mt-1 text-muted transition-transform ' + (expanded ? 'rotate-180' : '')}
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro">
                          <span className="rounded-pill bg-raised px-2 py-0.5 font-medium">
                            {lang === 'bn'
                              ? ORDER_STEPS.find((s) => s.status === o.deliveryStatus)?.labelBn
                              : ORDER_STEPS.find((s) => s.status === o.deliveryStatus)?.labelEn}
                          </span>
                          <span className="text-muted">
                            {t('expectedDate')} {shortDate(o.expectedDate)}
                          </span>
                        </div>
                      </button>

                      {expanded && (
                        <div className="border-t border-line">
                          {/* F-9.3 — step tracker, each step timestamped once reached */}
                          <ol className="px-4 py-4">
                            {ORDER_STEPS.map((step, i) => {
                              const event = o.timeline.find((e) => e.status === step.status);
                              const done = Boolean(event?.occurredAt);
                              const current = done && i === reached - 1;
                              return (
                                <li key={step.status} className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <span
                                      className={
                                        'grid h-6 w-6 shrink-0 place-items-center rounded-pill border-2 ' +
                                        (done
                                          ? 'border-accent bg-accent text-white'
                                          : 'border-line bg-surface')
                                      }
                                    >
                                      {done && <Icon name="check" size={12} />}
                                    </span>
                                    {i < ORDER_STEPS.length - 1 && (
                                      <span
                                        className={'w-0.5 flex-1 ' + (done ? 'bg-accent' : 'bg-line')}
                                        style={{ minHeight: 28 }}
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 pb-4">
                                    <p className={'text-small ' + (current ? 'font-semibold' : done ? 'font-medium' : 'text-muted')}>
                                      {lang === 'bn' ? step.labelBn : step.labelEn}
                                    </p>
                                    {event?.occurredAt && (
                                      <p className="text-micro text-muted">
                                        {shortDate(event.occurredAt)}
                                        {event.note ? ' · ' + event.note : ''}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ol>

                          {/* F-9.4 — line items, address, payment status */}
                          <div className="border-t border-line px-4 py-4">
                            <h3 className="eyebrow mb-3">Items</h3>
                            <ul className="space-y-3">
                              {o.lines.map((l, i) => (
                                <li key={i} className="flex items-center gap-3">
                                  <img
                                    src={imageUrl({
                                      seed: l.imageSeed,
                                      material: l.sizeMm === 'Slab' ? 'granite' : 'vitrified',
                                      hex: '#ddd7cc', type: 'flat', sizeMm: l.sizeMm,
                                    }, 'thumb')}
                                    alt="" width={40} height={40}
                                    className="h-10 w-10 shrink-0 rounded-sm object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-small font-medium">{l.productName}</p>
                                    <p className="text-micro text-muted">
                                      {l.boxes != null ? l.boxes + ' boxes · ' : ''}
                                      {l.sqft.toFixed(2)} sq ft @ ₹{l.rate}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-small font-medium">
                                    {rupees(l.lineTotal)}
                                  </span>
                                </li>
                              ))}
                            </ul>

                            <dl className="mt-4 divide-y divide-line text-small">
                              <div className="flex justify-between gap-4 py-2">
                                <dt className="text-muted">Total</dt>
                                <dd className="font-medium">{rupees(o.finalTotal)}</dd>
                              </div>
                              <div className="flex justify-between gap-4 py-2">
                                <dt className="text-muted">
                                  {o.paymentStatus === 'paid_in_full' ? t('paidInFull') : t('advancePaid')}
                                </dt>
                                <dd className="font-medium">{rupees(o.advancePaid)}</dd>
                              </div>
                              {o.paymentStatus !== 'paid_in_full' && (
                                <div className="flex justify-between gap-4 py-2">
                                  <dt className="text-muted">{t('balanceDue')}</dt>
                                  <dd className="font-semibold">{rupees(o.finalTotal - o.advancePaid)}</dd>
                                </div>
                              )}
                            </dl>

                            <div className="mt-4 rounded-sm bg-raised/60 p-3 text-small">
                              <p className="flex items-start gap-2">
                                <Icon name="pin" size={15} className="mt-0.5 shrink-0 text-muted" />
                                <span>{o.deliveryAddress}</span>
                              </p>
                              {o.vehicleNote && (
                                <p className="mt-2 flex items-start gap-2">
                                  <Icon name="truck" size={15} className="mt-0.5 shrink-0 text-muted" />
                                  <span>{o.vehicleNote}</span>
                                </p>
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                              {/* F-9.5 — WhatsApp with the order code pre-filled */}
                              <a
                                href={contactLinks().wa(
                                  'Hello Roman Marbel, about order ' + o.orderCode + ':',
                                )}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => track('whatsapp_click', { source: 'order', code: o.orderCode })}
                                className="btn-primary text-small"
                              >
                                {t('askAboutOrder')}
                              </a>
                              {/* F-9.6 — order again, pre-filled */}
                              <Link
                                to="/catalogue"
                                className="btn-secondary text-small"
                              >
                                {t('orderAgain')}
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
