import type { Settings } from '@/types';

/**
 * TRD §4 `setting` table. Every business constant lives here and is editable
 * from /admin/settings — never hardcoded at a call site, so a GST change is an
 * admin edit rather than a deploy (TRD §13.5).
 *
 * Values marked OWNER-CONFIRM are placeholders pending PRD §15.3 Q1–Q12.
 */
export const SETTINGS: Settings = {
  gstRatePct: 18,                    // OWNER-CONFIRM (Q2)
  defaultWastagePct: 8,
  minWastagePct: 5,                  // PRD F-5.3 range 5–15
  maxWastagePct: 15,
  adhesiveCoverageSqftPerBag: 35,
  adhesiveBagPrice: 380,
  groutFactorKgPerSqft: 0.1,
  groutPricePerKg: 90,
  skirtingRatePerFt: 30,
  cuttingChargeFlat: 450,
  largeAreaWarnSqft: 5000,
  rateValidityText: 'Rates updated 19 Sep 2026. Final rate confirmed at the shop.',
  labourRangeText:
    'Laying charges in this area are typically ₹22–35/sq ft, arranged separately. Not included in this estimate.',
  ownerWhatsapp: '917383695415',
  ownerPhone: '+917383695415',
  storeName: 'Roman Marbel',
  // PRD §2.1 note: the dictated brief said 713401 (Bardhaman town), records show
  // 713407 (Memari). Q1 is unresolved — 713407 used here as the store address.
  storeAddress: 'Ausha, Nabastha, Memari, Bardhaman, West Bengal',
  storePin: '713407',
  gstin: '19XXXXX0000X1ZX',          // OWNER-CONFIRM (Q11)
  hours: 'Mon–Sat 9:00 am – 8:00 pm · Sunday 10:00 am – 2:00 pm',
};
