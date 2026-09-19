// Types mirror the TRD §4 Postgres schema and §6.1 calculator contract exactly,
// so an Express/Mongo backend implementing those contracts drops in behind
// src/api/client.ts with no changes above this layer.

export type PricingUnit = 'box' | 'sqft' | 'slab';
export type StockStatus = 'in' | 'low' | 'out' | 'on_order';
export type BudgetBand = 'economy' | 'value' | 'premium';
export type Material = 'marble' | 'granite' | 'vitrified' | 'ceramic' | 'other';
export type Finish =
  | 'polished' | 'honed' | 'leather' | 'matt' | 'glossy' | 'anti_skid' | 'rustic';
export type ColourFamily =
  | 'white' | 'beige' | 'grey' | 'brown' | 'black' | 'wood' | 'multi';
export type Application =
  | 'floor' | 'wall' | 'bathroom' | 'kitchen' | 'outdoor' | 'stairs' | 'parking';
export type EnquiryType = 'standard' | 'bulk' | 'sample' | 'site_visit' | 'restock';
export type EnquiryStatus = 'new' | 'contacted' | 'quoted' | 'visited' | 'won' | 'lost';
export type OrderStatus =
  | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'advance_paid' | 'paid_in_full';
export type CustomerType = 'retail' | 'contractor' | 'builder';
export type RoomType =
  | 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'stairs' | 'outdoor' | 'wall';

export interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  icon: string;
}

export interface ProductImage {
  id: string;
  /** In production this is the CDN public_id; here it seeds the SVG texture. */
  cdnPublicId: string;
  type: 'flat' | 'context' | 'scale';
  sortOrder: number;
  altEn: string;
  altBn: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  thicknessMm: number | null;
  finish: Finish;
  retailRatePerSqft: number;
  dealerRatePerSqft: number | null;
  stockStatus: Exclude<StockStatus, 'on_order'>;
  lotNote: string | null;
  waterAbsorptionPct: number | null;
  compressiveStrengthMpa: number | null;
  quarryOrigin: string | null;
}

export interface Product {
  id: string;
  sku: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  categoryId: string;
  material: Material;
  sizeMm: string;
  finish: Finish;
  colourFamily: ColourFamily[];
  colourHexPrimary: string;
  pricingUnit: PricingUnit;
  ratePerSqft: number;
  mrpPerSqft: number | null;
  piecesPerBox: number | null;
  sqftPerBox: number | null;
  weightPerSqft: number;
  stockStatus: StockStatus;
  budgetBand: BudgetBand;
  application: Application[];
  isPublished: boolean;
  isFeatured: boolean;
  shadeVariationNote: string | null;
  rateUpdatedAt: string;
  images: ProductImage[];
  variants: ProductVariant[];
  /** Copy for the product page's expandable detail sheet (F-4.3). */
  careNote?: string;
  applicationNote?: string;
}

export interface Zone {
  id: string;
  name: string;
  label: string;
  coverage: string;
  radiusKm: string;
  pinCodes: string[];
  deliveryFlatCharge: number;
  freeAbove: number | null;
  minOrder: number | null;
  maxAutoWeightKg: number;
  siteVisitAvailable: boolean;
  autoPricing: boolean;
}

/** TRD §4 `setting` table — every business constant, never hardcoded. */
export interface Settings {
  gstRatePct: number;
  defaultWastagePct: number;
  minWastagePct: number;
  maxWastagePct: number;
  adhesiveCoverageSqftPerBag: number;
  adhesiveBagPrice: number;
  groutFactorKgPerSqft: number;
  groutPricePerKg: number;
  skirtingRatePerFt: number;
  cuttingChargeFlat: number;
  largeAreaWarnSqft: number;
  rateValidityText: string;
  labourRangeText: string;
  ownerWhatsapp: string;
  ownerPhone: string;
  storeName: string;
  storeAddress: string;
  storePin: string;
  gstin: string;
  hours: string;
}

// ---------------------------------------------------------------------------
// Calculator contract — TRD §6.1, field-for-field.
// ---------------------------------------------------------------------------

export interface AreaInput {
  areaLabel?: string;
  lengthFt: number;
  widthFt: number;
}

export interface CalcItemInput {
  productId: string;
  variantId?: string;
  areas: AreaInput[];
  wastagePctOverride?: number;
  includeSkirting?: boolean;
  includeAdhesive?: boolean;
  includeGrout?: boolean;
  includeCutting?: boolean;
}

export interface CalcRequest {
  items: CalcItemInput[];
  pinCode: string;
}

export interface CalcLineResult {
  productId: string;
  variantId?: string;
  areaLabel?: string;
  areaSqft: number;
  wastagePct: number;
  areaWithWastage: number;
  pricingUnit: PricingUnit;
  boxes: number | null;
  piecesTotal: number | null;
  actualSqftPurchased: number;
  ratePerSqft: number;
  materialCost: number;
  skirtingFt: number;
  skirtingCost: number;
  adhesiveBags: number;
  adhesiveCost: number;
  groutKg: number;
  groutCost: number;
  cuttingCost: number;
  needsShopConfirmation: boolean;
}

export interface CalcResult {
  lines: CalcLineResult[];
  materialSubtotal: number;
  addonsTotal: number;
  zone: { id: string; name: string } | null;
  deliveryCharge: number;
  deliveryNeedsQuote: boolean;
  totalWeightKg: number;
  gstAmount: number;
  total: number;
  warnings: string[];
}

export interface EstimateLine extends CalcLineResult {
  id: string;
  productName: string;
  productSlug: string;
  sizeMm: string;
  imageSeed: string;
}

export interface Estimate {
  referenceNo: string;
  sessionId: string;
  pinCode: string;
  zoneName: string | null;
  wastagePct: number;
  lines: EstimateLine[];
  materialSubtotal: number;
  addonsTotal: number;
  deliveryCharge: number;
  deliveryNeedsQuote: boolean;
  gstAmount: number;
  total: number;
  warnings: string[];
  source: 'browse' | 'wizard' | 'myhouse';
  createdAt: string;
  expiresAt: string;
}

export interface Enquiry {
  id: string;
  estimateRef: string | null;
  name: string;
  phone: string;
  phoneVerified: boolean;
  pinCode: string;
  zoneName: string | null;
  preferredContactTime: string;
  message: string;
  type: EnquiryType;
  status: EnquiryStatus;
  lostReason: string | null;
  leadScore: number;
  estimatedValue: number;
  productSummary: string;
  quantitySummary: string;
  sourcePage: string;
  notes: string[];
  createdAt: string;
  lastContactedAt: string | null;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  note: string;
  occurredAt: string | null;
}

export interface OrderLine {
  productName: string;
  sizeMm: string;
  boxes: number | null;
  sqft: number;
  rate: number;
  lineTotal: number;
  imageSeed: string;
}

export interface Order {
  id: string;
  orderCode: string;
  phone: string;
  customerName: string;
  lines: OrderLine[];
  quotedTotal: number;
  finalTotal: number;
  advancePaid: number;
  paymentStatus: PaymentStatus;
  deliveryStatus: OrderStatus;
  deliveryAddress: string;
  expectedDate: string;
  vehicleNote: string | null;
  timeline: OrderStatusEvent[];
  createdAt: string;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string; fields?: Record<string, string> } | null;
}
