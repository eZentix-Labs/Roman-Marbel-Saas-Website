import type {
  CalcItemInput, CalcLineResult, CalcRequest, CalcResult, Product, Settings, Zone,
} from '@/types';

/**
 * Implements TRD §6 / PRD §7.
 *
 * Hard rules this module keeps, because breaking any of them shows a customer a
 * wrong price (the PRD's #1 counter-metric):
 *   - Pure. No I/O, no Date.now(), no module-level mutable state. Everything it
 *     needs arrives as an argument, which is what makes §6.6 exhaustively testable.
 *   - `ceil` on boxes, never round. You cannot buy 0.6 of a box.
 *   - Wastage is applied once to the summed area of a product's areas, not per
 *     area (TRD §6.5).
 *   - Rates are read from the catalogue snapshot passed in, never from the client.
 */

export interface CatalogueSnapshot {
  getProduct(id: string): Product | undefined;
}

export class CalcValidationError extends Error {
  constructor(public code: string, message: string, public field?: string) {
    super(message);
    this.name = 'CalcValidationError';
  }
}

/** Money is rounded to paise at every step so totals cannot drift. */
const money = (n: number): number => Math.round(n * 100) / 100;
const round2 = money;

/** PRD §7.2 wastage table. The user may override; this is the starting value. */
export function defaultWastageFor(product: Product, settings: Settings): number {
  if (product.pricingUnit === 'slab') return 12;
  if (product.material === 'marble' || product.material === 'granite') return 12;
  const [w, h] = product.sizeMm.split(/[x×]/).map((s) => parseInt(s, 10));
  if (Number.isFinite(w) && Number.isFinite(h) && w <= 300 && h <= 300) return 10;
  return settings.defaultWastagePct;
}

export function resolveZone(pinCode: string, zones: Zone[]): Zone | null {
  const pin = (pinCode || '').trim();
  if (!/^\d{6}$/.test(pin)) return null;
  // Deterministic on overlap: first match in declared order wins (TRD §12.2).
  return zones.find((z) => z.pinCodes.includes(pin)) ?? null;
}

/**
 * TRD §6.4 — role resolution lives outside calculate() so the engine stays free
 * of auth concerns. A retail visitor can never reach a dealer rate, because the
 * customer type is resolved server-side, not toggled in the UI (PRD F-8.6).
 */
export function resolveRate(
  product: Product,
  variantId: string | undefined,
  customerType: 'retail' | 'contractor' | 'builder' = 'retail',
): number {
  const variant = variantId ? product.variants.find((v) => v.id === variantId) : undefined;
  if (
    (customerType === 'contractor' || customerType === 'builder') &&
    variant?.dealerRatePerSqft != null
  ) {
    return variant.dealerRatePerSqft;
  }
  return variant?.retailRatePerSqft ?? product.ratePerSqft;
}

function validateItem(item: CalcItemInput, product: Product) {
  if (!item.areas.length) {
    throw new CalcValidationError('VALIDATION_ERROR', 'At least one area is required', 'areas');
  }
  for (const a of item.areas) {
    if (!Number.isFinite(a.lengthFt) || !Number.isFinite(a.widthFt)) {
      throw new CalcValidationError('VALIDATION_ERROR', 'Length and width must be numbers', 'areas');
    }
    // TRD §6.5: zero or negative is a 400, never silently coerced to 0.
    if (a.lengthFt <= 0 || a.widthFt <= 0) {
      throw new CalcValidationError(
        'VALIDATION_ERROR', 'Length and width must be greater than zero', 'areas',
      );
    }
  }
  if (product.pricingUnit === 'box' && !product.sqftPerBox) {
    // Bad catalogue data, not bad user input — never surface a divide-by-zero.
    throw new CalcValidationError(
      'CATALOGUE_DATA_ERROR',
      'Product ' + product.sku + ' is box-priced but has no sq ft per box',
    );
  }
}

export function calculate(
  req: CalcRequest,
  catalogue: CatalogueSnapshot,
  settings: Settings,
  zones: Zone[],
  customerType: 'retail' | 'contractor' | 'builder' = 'retail',
): CalcResult {
  const lines: CalcLineResult[] = [];
  const warnings: string[] = [];
  let totalWeightKg = 0;

  for (const item of req.items) {
    const product = catalogue.getProduct(item.productId);
    if (!product) {
      throw new CalcValidationError('NOT_FOUND', 'Unknown product ' + item.productId, 'productId');
    }
    validateItem(item, product);

    const rate = resolveRate(product, item.variantId, customerType);

    // Sum first, then apply wastage once (TRD §6.5).
    const areaSqft = round2(
      item.areas.reduce((sum, a) => sum + a.lengthFt * a.widthFt, 0),
    );

    // Clamp server-side regardless of what the client sent.
    const requested = item.wastagePctOverride ?? defaultWastageFor(product, settings);
    const wastagePct = Math.min(
      settings.maxWastagePct,
      Math.max(settings.minWastagePct, requested),
    );

    const areaWithWastage = round2(areaSqft * (1 + wastagePct / 100));

    let boxes: number | null = null;
    let piecesTotal: number | null = null;
    let actualSqftPurchased: number;
    let needsShopConfirmation = false;

    if (product.pricingUnit === 'box') {
      boxes = Math.ceil(areaWithWastage / product.sqftPerBox!);
      piecesTotal = product.piecesPerBox ? boxes * product.piecesPerBox : null;
      actualSqftPurchased = round2(boxes * product.sqftPerBox!);
    } else {
      // sqft and slab both price on area. Slabs are irregular, so the shop confirms.
      actualSqftPurchased = areaWithWastage;
      if (product.pricingUnit === 'slab') needsShopConfirmation = true;
    }

    const materialCost = money(actualSqftPurchased * rate);

    let skirtingFt = 0, skirtingCost = 0;
    if (item.includeSkirting) {
      skirtingFt = round2(
        item.areas.reduce((s, a) => s + 2 * (a.lengthFt + a.widthFt), 0),
      );
      skirtingCost = money(skirtingFt * settings.skirtingRatePerFt);
    }

    let adhesiveBags = 0, adhesiveCost = 0;
    if (item.includeAdhesive) {
      adhesiveBags = Math.ceil(areaWithWastage / settings.adhesiveCoverageSqftPerBag);
      adhesiveCost = money(adhesiveBags * settings.adhesiveBagPrice);
    }

    let groutKg = 0, groutCost = 0;
    if (item.includeGrout) {
      groutKg = round2(areaWithWastage * settings.groutFactorKgPerSqft);
      groutCost = money(groutKg * settings.groutPricePerKg);
    }

    const cuttingCost = item.includeCutting ? settings.cuttingChargeFlat : 0;

    if (areaSqft > settings.largeAreaWarnSqft) {
      warnings.push('Unusually large area — please confirm with the shop.');
    }
    if (needsShopConfirmation) {
      warnings.push(
        product.nameEn +
          ' is sold by the slab. Slab sizes are irregular, so the shop confirms the final quantity.',
      );
    }

    totalWeightKg += actualSqftPurchased * product.weightPerSqft;

    lines.push({
      productId: product.id,
      variantId: item.variantId,
      areaLabel: item.areas[0]?.areaLabel,
      areaSqft,
      wastagePct,
      areaWithWastage,
      pricingUnit: product.pricingUnit,
      boxes,
      piecesTotal,
      actualSqftPurchased,
      ratePerSqft: rate,
      materialCost,
      skirtingFt,
      skirtingCost,
      adhesiveBags,
      adhesiveCost,
      groutKg,
      groutCost,
      cuttingCost,
      needsShopConfirmation,
    });
  }

  const materialSubtotal = money(lines.reduce((s, l) => s + l.materialCost, 0));
  const addonsTotal = money(
    lines.reduce((s, l) => s + l.skirtingCost + l.adhesiveCost + l.groutCost + l.cuttingCost, 0),
  );

  totalWeightKg = round2(totalWeightKg);

  const zone = resolveZone(req.pinCode, zones);
  let deliveryCharge = 0;
  let deliveryNeedsQuote = false;

  if (!zone) {
    deliveryNeedsQuote = true;
    warnings.push('PIN not in our delivery map — delivery to be confirmed. We will call you.');
  } else if (!zone.autoPricing) {
    deliveryNeedsQuote = true;
    warnings.push(zone.name + ': delivery is quoted per order by the shop.');
  } else if (totalWeightKg > zone.maxAutoWeightKg) {
    // PRD §7.6 — stop calculating rather than guess.
    deliveryNeedsQuote = true;
    warnings.push('Large order — delivery quoted by the shop.');
  } else {
    const goods = materialSubtotal + addonsTotal;
    deliveryCharge =
      zone.freeAbove != null && goods >= zone.freeAbove ? 0 : zone.deliveryFlatCharge;
  }

  if (zone?.minOrder != null && materialSubtotal + addonsTotal < zone.minOrder) {
    warnings.push(
      zone.name + ' has a minimum order of ₹' + zone.minOrder.toLocaleString('en-IN') + '.',
    );
  }

  const gstAmount = money((materialSubtotal + addonsTotal) * settings.gstRatePct / 100);
  const total = money(materialSubtotal + addonsTotal + deliveryCharge + gstAmount);

  return {
    lines,
    materialSubtotal,
    addonsTotal,
    zone: zone ? { id: zone.id, name: zone.name } : null,
    deliveryCharge,
    deliveryNeedsQuote,
    totalWeightKg,
    gstAmount,
    total,
    warnings: [...new Set(warnings)],
  };
}

/** Feet + inches → decimal feet. PRD F-3.2 accepts ft+in, decimal ft and metres. */
export const ftIn = (feet: number, inches = 0): number => feet + inches / 12;
export const metresToFt = (m: number): number => m * 3.28084;

/** PRD F-5.8 — RM-DDMM-NNNN, quoted at the counter and in the admin panel. */
export function makeReferenceNo(now: Date, seq: number): string {
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return 'RM-' + dd + mm + '-' + String(seq).padStart(4, '0');
}
