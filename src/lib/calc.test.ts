import { describe, expect, it } from 'vitest';
import {
  calculate, CalcValidationError, defaultWastageFor, resolveRate, resolveZone,
} from './calc';
import { SETTINGS } from '@/api/mock/settings';
import { ZONES } from '@/api/mock/zones';
import { PRODUCTS } from '@/api/mock/products';
import type { Product } from '@/types';

const catalogue = { getProduct: (id: string) => PRODUCTS.find((p) => p.id === id) };
const byId = (id: string) => PRODUCTS.find((p) => p.id === id)!;

/**
 * TRD §6.6: the PRD §7.9 worked example is codified here. Any change to the
 * engine that moves this number must justify itself in the PR description.
 *
 *   Living room 14 ft × 12 ft, 600×600 vitrified at ₹52/sq ft, Zone A
 *   Floor area 168.00 · wastage 8% → 181.44 · 15.50 sq ft/box
 *   boxes ceil(11.70) = 12 · actual 186.00 · material ₹9,672
 *   skirting 52 ft @ ₹30 = ₹1,560 · adhesive 6 bags @ ₹380 = ₹2,280
 *   subtotal ₹13,512 · GST 18% ₹2,432 · delivery ₹0 · total ₹15,944
 */
describe('PRD §7.9 worked example', () => {
  const result = calculate(
    {
      items: [{
        productId: 'p-carrara-white-vitrified',
        areas: [{ areaLabel: 'Living room', lengthFt: 14, widthFt: 12 }],
        wastagePctOverride: 8,
        includeSkirting: true,
        includeAdhesive: true,
      }],
      pinCode: '713407', // Zone A
    },
    catalogue, SETTINGS, ZONES,
  );
  const line = result.lines[0];

  it('floor area is 168.00 sq ft', () => expect(line.areaSqft).toBe(168));
  it('area with 8% wastage is 181.44 sq ft', () => expect(line.areaWithWastage).toBe(181.44));
  it('requires 12 boxes (ceil of 11.70, never round)', () => expect(line.boxes).toBe(12));
  it('purchases 186.00 sq ft', () => expect(line.actualSqftPurchased).toBe(186));
  it('material cost is ₹9,672', () => expect(line.materialCost).toBe(9672));
  it('skirting is 52 running ft at ₹1,560', () => {
    expect(line.skirtingFt).toBe(52);
    expect(line.skirtingCost).toBe(1560);
  });
  it('adhesive is 6 bags at ₹2,280', () => {
    expect(line.adhesiveBags).toBe(6);
    expect(line.adhesiveCost).toBe(2280);
  });
  it('subtotal is ₹13,512', () => {
    expect(result.materialSubtotal + result.addonsTotal).toBe(13512);
  });
  it('GST at 18% is ₹2,432', () => expect(Math.round(result.gstAmount)).toBe(2432));
  it('Zone A delivery is free above threshold', () => {
    expect(result.deliveryCharge).toBe(0);
    expect(result.zone?.name).toContain('Zone A');
  });
  it('estimate total is ₹15,944', () => expect(Math.round(result.total)).toBe(15944));
});

describe('TRD §6.5 edge cases', () => {
  const base = (over: Partial<Parameters<typeof calculate>[0]> = {}) => ({
    items: [{ productId: 'p-carrara-white-vitrified', areas: [{ lengthFt: 10, widthFt: 10 }] }],
    pinCode: '713407',
    ...over,
  });

  it('rejects a zero dimension rather than coercing it', () => {
    expect(() => calculate(
      base({ items: [{ productId: 'p-carrara-white-vitrified', areas: [{ lengthFt: 0, widthFt: 10 }] }] }),
      catalogue, SETTINGS, ZONES,
    )).toThrow(CalcValidationError);
  });

  it('rejects a negative dimension', () => {
    expect(() => calculate(
      base({ items: [{ productId: 'p-carrara-white-vitrified', areas: [{ lengthFt: -4, widthFt: 10 }] }] }),
      catalogue, SETTINGS, ZONES,
    )).toThrow(/greater than zero/);
  });

  it('accepts an absurd area but flags it', () => {
    const r = calculate(
      base({ items: [{ productId: 'p-carrara-white-vitrified', areas: [{ lengthFt: 9999, widthFt: 9999 }] }] }),
      catalogue, SETTINGS, ZONES,
    );
    expect(r.warnings.some((w) => /Unusually large area/.test(w))).toBe(true);
  });

  it('clamps wastage below the floor and above the ceiling', () => {
    const low = calculate(
      base({ items: [{ productId: 'p-carrara-white-vitrified', areas: [{ lengthFt: 10, widthFt: 10 }], wastagePctOverride: -50 }] }),
      catalogue, SETTINGS, ZONES,
    );
    const high = calculate(
      base({ items: [{ productId: 'p-carrara-white-vitrified', areas: [{ lengthFt: 10, widthFt: 10 }], wastagePctOverride: 900 }] }),
      catalogue, SETTINGS, ZONES,
    );
    expect(low.lines[0].wastagePct).toBe(SETTINGS.minWastagePct);
    expect(high.lines[0].wastagePct).toBe(SETTINGS.maxWastagePct);
  });

  it('treats a box-priced product with no sqftPerBox as a catalogue data error', () => {
    const broken: Product = { ...byId('p-carrara-white-vitrified'), id: 'broken', sqftPerBox: null };
    expect(() => calculate(
      { items: [{ productId: 'broken', areas: [{ lengthFt: 10, widthFt: 10 }] }], pinCode: '713407' },
      { getProduct: () => broken }, SETTINGS, ZONES,
    )).toThrow(/box-priced but has no sq ft per box/);
  });

  it('sums multiple areas before applying wastage once, not per area', () => {
    const r = calculate(
      {
        items: [{
          productId: 'p-carrara-white-vitrified',
          areas: [{ lengthFt: 10, widthFt: 10 }, { lengthFt: 8, widthFt: 6 }],
          wastagePctOverride: 8,
        }],
        pinCode: '713407',
      },
      catalogue, SETTINGS, ZONES,
    );
    expect(r.lines[0].areaSqft).toBe(148);
    expect(r.lines[0].areaWithWastage).toBe(159.84); // 148 × 1.08, once
  });

  it('returns a quotable estimate for a PIN outside every zone, never an error', () => {
    const r = calculate(base({ pinCode: '110001' }), catalogue, SETTINGS, ZONES);
    expect(r.zone).toBeNull();
    expect(r.deliveryNeedsQuote).toBe(true);
    expect(r.total).toBeGreaterThan(0);
  });

  it('stops auto-pricing delivery above the zone weight ceiling', () => {
    const r = calculate(
      {
        items: [{ productId: 'p-carrara-white-vitrified', areas: [{ lengthFt: 200, widthFt: 200 }] }],
        pinCode: '713407',
      },
      catalogue, SETTINGS, ZONES,
    );
    expect(r.deliveryNeedsQuote).toBe(true);
    expect(r.deliveryCharge).toBe(0);
    expect(r.warnings.some((w) => /Large order/.test(w))).toBe(true);
  });
});

describe('slab pricing branch (PRD §7.3)', () => {
  it('skips box math and forces shop confirmation', () => {
    const slab = PRODUCTS.find((p) => p.pricingUnit === 'slab')!;
    const r = calculate(
      { items: [{ productId: slab.id, areas: [{ lengthFt: 12, widthFt: 10 }] }], pinCode: '713407' },
      catalogue, SETTINGS, ZONES,
    );
    expect(r.lines[0].boxes).toBeNull();
    expect(r.lines[0].needsShopConfirmation).toBe(true);
    expect(r.lines[0].actualSqftPurchased).toBe(r.lines[0].areaWithWastage);
  });

  it('defaults natural raised to 12% wastage', () => {
    const slab = PRODUCTS.find((p) => p.pricingUnit === 'slab')!;
    expect(defaultWastageFor(slab, SETTINGS)).toBe(12);
  });
});

describe('resolveZone', () => {
  it('finds Zone A for the store PIN', () => {
    expect(resolveZone('713407', ZONES)?.name).toContain('Zone A');
  });
  it('returns null for a PIN in no zone', () => {
    expect(resolveZone('110001', ZONES)).toBeNull();
  });
  it('returns null for a malformed PIN rather than guessing', () => {
    expect(resolveZone('71340', ZONES)).toBeNull();
    expect(resolveZone('abcdef', ZONES)).toBeNull();
    expect(resolveZone('', ZONES)).toBeNull();
  });
});

describe('resolveRate (TRD §6.4)', () => {
  const p = byId('p-absolute-black-granite');
  const variant = p.variants[0];

  it('gives a retail customer the retail rate', () => {
    expect(resolveRate(p, variant.id, 'retail')).toBe(variant.retailRatePerSqft);
  });
  it('gives a contractor the dealer rate when one exists', () => {
    expect(resolveRate(p, variant.id, 'contractor')).toBe(variant.dealerRatePerSqft);
  });
  it('falls back to the retail rate when no dealer rate is set', () => {
    const noDealer = { ...p, variants: [{ ...variant, dealerRatePerSqft: null }] };
    expect(resolveRate(noDealer, variant.id, 'contractor')).toBe(variant.retailRatePerSqft);
  });
  it('falls back to the product rate when there is no variant', () => {
    expect(resolveRate(p, undefined, 'retail')).toBe(p.ratePerSqft);
  });
});
