/**
 * TRD §9.5 — the custom event set is fixed regardless of whether GA4 or
 * Plausible is wired in behind it. These are the events that answer the PRD's
 * §9.6 question: where do people drop out between photo and enquiry.
 *
 * With no provider configured this logs to the console in dev and is a no-op in
 * production — it never blocks a render and never loads a third-party script
 * on the critical path (PRD N-1.6).
 */

export type AnalyticsEvent =
  | 'product_view'
  | 'filter_applied'
  | 'wizard_start'
  | 'wizard_step'
  | 'wizard_complete'
  | 'estimate_generated'
  | 'estimate_shared'
  | 'whatsapp_click'
  | 'call_click'
  | 'enquiry_submit'
  | 'order_lookup'
  | 'restock_request'
  | 'sample_request'
  | 'compare_open'
  | 'language_switch'
  | 'search';

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Props }) => void;
  }
}

export function track(event: AnalyticsEvent, props: Props = {}): void {
  try {
    if (typeof window === 'undefined') return;
    if (window.plausible) window.plausible(event, { props });
    else if (window.gtag) window.gtag('event', event, props);
    else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', event, props);
    }
  } catch {
    /* Analytics must never break the page. */
  }
}
