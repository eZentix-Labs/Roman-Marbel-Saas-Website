import type { Zone } from '@/types';

/**
 * PRD §2.2 delivery zones. PIN-to-zone is a flat lookup table maintained by the
 * owner in admin, never hardcoded logic (TRD §6.3) — this file is the seed the
 * admin screen edits.
 *
 * Charges and thresholds are placeholders pending PRD §15.3 Q3.
 */
export const ZONES: Zone[] = [
  {
    id: 'zone-a',
    name: 'Zone A — Core',
    label: 'Memari, Bardhaman town',
    coverage: 'Memari, Bardhaman town and adjacent',
    radiusKm: '0–25 km',
    pinCodes: [
      '713407', '713401', '713101', '713102', '713103', '713104',
      '713125', '713126', '713140', '713141', '713422',
    ],
    deliveryFlatCharge: 600,
    freeAbove: 12000,
    minOrder: null,
    maxAutoWeightKg: 3000,
    siteVisitAvailable: true,
    autoPricing: true,
  },
  {
    id: 'zone-b',
    name: 'Zone B — District',
    label: 'Kalna, Katwa, Jamalpur, Raina, Galsi, Bhatar',
    coverage: 'Kalna, Katwa, Jamalpur, Raina, Galsi, Bhatar',
    radiusKm: '25–60 km',
    pinCodes: [
      '713409', '713408', '713130', '713150', '713151', '713152',
      '713403', '713404', '713405', '713406', '713421', '713423',
      '713512', '713513', '713514',
    ],
    deliveryFlatCharge: 1400,
    freeAbove: null,
    minOrder: 6000,
    maxAutoWeightKg: 2500,
    siteVisitAvailable: true,
    autoPricing: true,
  },
  {
    id: 'zone-c',
    name: 'Zone C — Extended',
    label: 'Durgapur, Asansol, Panagarh, Kanksa',
    coverage: 'Durgapur, Asansol, Panagarh, Kanksa (Paschim Bardhaman)',
    radiusKm: '60–130 km',
    pinCodes: [
      '713201', '713202', '713203', '713204', '713205', '713206',
      '713207', '713208', '713209', '713210', '713212', '713213',
      '713301', '713302', '713303', '713304', '713305', '713325',
      '713331', '713332', '713335', '713346', '713347', '713148',
    ],
    // PRD §2.2: Zone C is quoted per order, never auto-calculated.
    deliveryFlatCharge: 0,
    freeAbove: null,
    minOrder: 25000,
    maxAutoWeightKg: 0,
    siteVisitAvailable: false,
    autoPricing: false,
  },
];

/**
 * PRD §2.2: a PIN outside the map must not be a dead end. Zone D is not a row in
 * the lookup — it is the absence of one, handled by the calculator returning
 * zone: null and the UI offering "we will call you".
 */
export const ZONE_D_COPY = {
  name: 'Outside our delivery districts',
  body:
    'We do not auto-price delivery outside Purba and Paschim Bardhaman, but we still want your enquiry. Leave your number and we will call you with a delivery quote.',
};
