import type {
  Application, BudgetBand, ColourFamily, Finish, Material, Product, ProductVariant, StockStatus,
} from '@/types';

/**
 * Seed catalogue. In production these rows come from Postgres via
 * GET /api/v1/products; the shape here matches that response exactly.
 *
 * PRD Phase 0 targets 80–150 real SKUs with real rates and a proper photography
 * day. This file is 30 representative products covering every category, pricing
 * unit and stock state, so every branch in the UI and the calculator has
 * something real to render.
 */

/** PRD §7.3 reference table — seeds box math from the nominal tile size. */
const BOX_SPEC: Record<string, { pieces: number; sqft: number }> = {
  '600x600': { pieces: 4, sqft: 15.5 },
  '800x800': { pieces: 3, sqft: 20.67 },
  '600x1200': { pieces: 2, sqft: 15.5 },
  '300x300': { pieces: 11, sqft: 10.66 },
  '300x600': { pieces: 6, sqft: 11.63 },
  '400x400': { pieces: 6, sqft: 10.33 },
  '600x900': { pieces: 3, sqft: 17.44 },
  '200x1200': { pieces: 5, sqft: 12.92 },
};

interface Seed {
  slug: string;
  nameEn: string;
  nameBn: string;
  sku: string;
  category: string;
  material: Material;
  size: string;
  finish: Finish;
  colours: ColourFamily[];
  hex: string;
  rate: number;
  mrp?: number;
  stock?: StockStatus;
  band: BudgetBand;
  apps: Application[];
  featured?: boolean;
  pricingUnit?: 'box' | 'sqft' | 'slab';
  weight?: number;
  shadeNote?: string;
  variants?: Omit<ProductVariant, 'id' | 'productId'>[];
  care?: string;
  appNote?: string;
  rateUpdatedDaysAgo?: number;
}

const SEEDS: Seed[] = [
  // ---- Vitrified ---------------------------------------------------------
  {
    slug: 'carrara-white-vitrified', nameEn: 'Carrara White Vitrified', nameBn: 'ক্যারারা হোয়াইট ভিট্রিফায়েড',
    sku: 'RM-VIT-6060-CW', category: 'c-vitrified', material: 'vitrified', size: '600x600',
    finish: 'polished', colours: ['white', 'grey'], hex: '#eceae4', rate: 52, mrp: 68,
    band: 'value', apps: ['floor'],
    featured: true,
    care: 'Mop with plain water or a mild floor cleaner. Avoid acid-based cleaners — they dull the polish.',
    appNote: 'Suits living rooms, bedrooms and passages. Not recommended for a bathroom floor without anti-skid.',
    rateUpdatedDaysAgo: 4,
  },
  {
    slug: 'ivory-cream-vitrified', nameEn: 'Ivory Cream Vitrified', nameBn: 'আইভরি ক্রিম ভিট্রিফায়েড',
    sku: 'RM-VIT-6060-IC', category: 'c-vitrified', material: 'vitrified', size: '600x600',
    finish: 'glossy', colours: ['beige', 'white'], hex: '#e8dcc6', rate: 48,
    band: 'value', apps: ['floor'], rateUpdatedDaysAgo: 9,
  },
  {
    slug: 'statuario-gold-vitrified', nameEn: 'Statuario Gold Vitrified', nameBn: 'স্ট্যাচুয়ারিও গোল্ড',
    sku: 'RM-VIT-8080-SG', category: 'c-vitrified', material: 'vitrified', size: '800x800',
    finish: 'polished', colours: ['white', 'beige'], hex: '#f0ece2', rate: 96, mrp: 124,
    band: 'premium', apps: ['floor'], featured: true, rateUpdatedDaysAgo: 2,
    appNote: 'Large format — fewer joints across a big living room floor.',
  },
  {
    slug: 'graphite-grey-vitrified', nameEn: 'Graphite Grey Vitrified', nameBn: 'গ্রাফাইট গ্রে',
    sku: 'RM-VIT-6060-GG', category: 'c-vitrified', material: 'vitrified', size: '600x600',
    finish: 'matt', colours: ['grey'], hex: '#8e8d89', rate: 58, band: 'value',
    apps: ['floor', 'outdoor'], stock: 'low', rateUpdatedDaysAgo: 12,
  },
  {
    slug: 'oak-wood-plank-vitrified', nameEn: 'Oak Wood Plank', nameBn: 'ওক উড প্ল্যাঙ্ক',
    sku: 'RM-VIT-2012-OW', category: 'c-vitrified', material: 'other', size: '200x1200',
    finish: 'matt', colours: ['wood', 'brown'], hex: '#b58453', rate: 74, band: 'value',
    apps: ['floor'], featured: true, rateUpdatedDaysAgo: 6,
    appNote: 'Plank format laid in a stagger. Wood look without the maintenance of real wood.',
  },
  {
    slug: 'travertine-beige-vitrified', nameEn: 'Travertine Beige', nameBn: 'ট্রাভার্টিন বেইজ',
    sku: 'RM-VIT-6012-TB', category: 'c-vitrified', material: 'vitrified', size: '600x1200',
    finish: 'matt', colours: ['beige'], hex: '#d8c7a8', rate: 88, band: 'premium',
    apps: ['floor'], rateUpdatedDaysAgo: 15,
  },
  {
    slug: 'onyx-charcoal-vitrified', nameEn: 'Onyx Charcoal', nameBn: 'অনিক্স চারকোল',
    sku: 'RM-VIT-6012-OC', category: 'c-vitrified', material: 'vitrified', size: '600x1200',
    finish: 'glossy', colours: ['black', 'grey'], hex: '#39373a', rate: 112, band: 'premium',
    apps: ['floor', 'wall'], stock: 'low', rateUpdatedDaysAgo: 3,
  },
  {
    slug: 'sandstorm-vitrified', nameEn: 'Sandstorm Vitrified', nameBn: 'স্যান্ডস্টর্ম',
    sku: 'RM-VIT-8080-SS', category: 'c-vitrified', material: 'vitrified', size: '800x800',
    finish: 'matt', colours: ['beige', 'brown'], hex: '#c9ab84', rate: 82, band: 'premium',
    apps: ['floor'], rateUpdatedDaysAgo: 21,
  },

  // ---- Marble ------------------------------------------------------------
  {
    slug: 'makrana-white-marble', nameEn: 'Makrana White Marble', nameBn: 'মাকরানা সাদা মার্বেল',
    sku: 'RM-MAR-SLB-MW', category: 'c-marble', material: 'marble', size: 'slab',
    finish: 'polished', colours: ['white'], hex: '#efece5', rate: 165, pricingUnit: 'slab',
    band: 'premium', apps: ['floor', 'stairs'], featured: true, weight: 3.1,
    shadeNote: 'Natural raised — veining and shade vary slab to slab. Pick your slabs at the godown before cutting.',
    variants: [
      { thicknessMm: 16, finish: 'polished', retailRatePerSqft: 165, dealerRatePerSqft: 148, stockStatus: 'in', lotNote: 'Lot 42 — light veining, 9 slabs', waterAbsorptionPct: 0.4, compressiveStrengthMpa: 72, quarryOrigin: 'Makrana, Rajasthan' },
      { thicknessMm: 16, finish: 'honed', retailRatePerSqft: 172, dealerRatePerSqft: 155, stockStatus: 'low', lotNote: 'Lot 39 — 3 slabs left', waterAbsorptionPct: 0.4, compressiveStrengthMpa: 72, quarryOrigin: 'Makrana, Rajasthan' },
      { thicknessMm: 20, finish: 'polished', retailRatePerSqft: 198, dealerRatePerSqft: 178, stockStatus: 'in', lotNote: null, waterAbsorptionPct: 0.38, compressiveStrengthMpa: 78, quarryOrigin: 'Makrana, Rajasthan' },
    ],
    care: 'Seal once a year. Wipe spills immediately — turmeric, lime and acidic food stain marble permanently.',
    rateUpdatedDaysAgo: 1,
  },
  {
    slug: 'banswara-pink-marble', nameEn: 'Banswara Pink Marble', nameBn: 'বাঁশওয়ারা পিঙ্ক মার্বেল',
    sku: 'RM-MAR-SLB-BP', category: 'c-marble', material: 'marble', size: 'slab',
    finish: 'polished', colours: ['beige', 'multi'], hex: '#e0cbbd', rate: 138, pricingUnit: 'slab',
    band: 'premium', apps: ['floor', 'stairs'], weight: 3.0,
    shadeNote: 'Natural raised — veining and shade vary slab to slab.',
    variants: [
      { thicknessMm: 16, finish: 'polished', retailRatePerSqft: 138, dealerRatePerSqft: 124, stockStatus: 'in', lotNote: 'Lot 51 — warm veining', waterAbsorptionPct: 0.42, compressiveStrengthMpa: 68, quarryOrigin: 'Banswara, Rajasthan' },
      { thicknessMm: 20, finish: 'polished', retailRatePerSqft: 162, dealerRatePerSqft: 146, stockStatus: 'out', lotNote: 'Next lot expected in 3 weeks', waterAbsorptionPct: 0.42, compressiveStrengthMpa: 70, quarryOrigin: 'Banswara, Rajasthan' },
    ],
    rateUpdatedDaysAgo: 8,
  },
  {
    slug: 'indian-green-marble', nameEn: 'Indian Green Marble', nameBn: 'ইন্ডিয়ান গ্রিন মার্বেল',
    sku: 'RM-MAR-SLB-IG', category: 'c-marble', material: 'marble', size: 'slab',
    finish: 'polished', colours: ['multi', 'black'], hex: '#4a6350', rate: 152, pricingUnit: 'slab',
    band: 'premium', apps: ['floor', 'wall', 'stairs'], weight: 3.1, stock: 'low',
    shadeNote: 'Natural raised — veining and shade vary slab to slab.',
    rateUpdatedDaysAgo: 18,
  },
  {
    slug: 'katni-beige-marble', nameEn: 'Katni Beige Marble', nameBn: 'কাটনি বেইজ মার্বেল',
    sku: 'RM-MAR-SLB-KB', category: 'c-marble', material: 'marble', size: 'slab',
    finish: 'polished', colours: ['beige'], hex: '#ddcdaa', rate: 118, pricingUnit: 'slab',
    band: 'value', apps: ['floor', 'stairs'], weight: 3.0,
    shadeNote: 'Natural raised — veining and shade vary slab to slab.',
    rateUpdatedDaysAgo: 11,
  },

  // ---- Granite -----------------------------------------------------------
  {
    slug: 'absolute-black-granite', nameEn: 'Absolute Black Granite', nameBn: 'অ্যাবসলিউট ব্ল্যাক গ্রানাইট',
    sku: 'RM-GRN-SLB-AB', category: 'c-granite', material: 'granite', size: 'slab',
    finish: 'polished', colours: ['black'], hex: '#232224', rate: 142, pricingUnit: 'slab',
    band: 'premium', apps: ['floor', 'kitchen', 'stairs'], featured: true, weight: 3.3,
    shadeNote: 'Natural raised — shade and grain vary by block. Buy the full requirement from one lot.',
    variants: [
      { thicknessMm: 18, finish: 'polished', retailRatePerSqft: 142, dealerRatePerSqft: 128, stockStatus: 'in', lotNote: 'Lot 42 — even grain, 11 slabs', waterAbsorptionPct: 0.1, compressiveStrengthMpa: 210, quarryOrigin: 'Chamrajnagar, Karnataka' },
      { thicknessMm: 18, finish: 'honed', retailRatePerSqft: 149, dealerRatePerSqft: 134, stockStatus: 'in', lotNote: null, waterAbsorptionPct: 0.1, compressiveStrengthMpa: 210, quarryOrigin: 'Chamrajnagar, Karnataka' },
      { thicknessMm: 18, finish: 'leather', retailRatePerSqft: 168, dealerRatePerSqft: 151, stockStatus: 'low', lotNote: 'Lot 38 — 3 slabs left', waterAbsorptionPct: 0.1, compressiveStrengthMpa: 208, quarryOrigin: 'Chamrajnagar, Karnataka' },
      { thicknessMm: 20, finish: 'polished', retailRatePerSqft: 176, dealerRatePerSqft: 158, stockStatus: 'in', lotNote: null, waterAbsorptionPct: 0.09, compressiveStrengthMpa: 224, quarryOrigin: 'Chamrajnagar, Karnataka' },
      { thicknessMm: 20, finish: 'leather', retailRatePerSqft: 201, dealerRatePerSqft: 181, stockStatus: 'out', lotNote: 'Out of stock — next block cut in October', waterAbsorptionPct: 0.09, compressiveStrengthMpa: 224, quarryOrigin: 'Chamrajnagar, Karnataka' },
    ],
    care: 'Granite is the hardest thing you can put on a floor. Plain water and a soft mop is all it needs.',
    appNote: 'Kitchen platforms, stair treads, heavy-traffic floors. Overkill for a bedroom — and priced like it.',
    rateUpdatedDaysAgo: 2,
  },
  {
    slug: 'coastal-grey-granite', nameEn: 'Coastal Grey Granite', nameBn: 'কোস্টাল গ্রে গ্রানাইট',
    sku: 'RM-GRN-SLB-CG', category: 'c-granite', material: 'granite', size: 'slab',
    finish: 'honed', colours: ['grey'], hex: '#8d8b88', rate: 110, pricingUnit: 'slab',
    band: 'premium', apps: ['floor', 'outdoor', 'stairs'], featured: true, stock: 'low', weight: 3.2,
    shadeNote: 'Natural raised — shade and grain vary by block.',
    variants: [
      { thicknessMm: 18, finish: 'honed', retailRatePerSqft: 110, dealerRatePerSqft: 99, stockStatus: 'low', lotNote: 'Lot 27 — 4 slabs left', waterAbsorptionPct: 0.12, compressiveStrengthMpa: 195, quarryOrigin: 'Khammam, Telangana' },
      { thicknessMm: 18, finish: 'polished', retailRatePerSqft: 106, dealerRatePerSqft: 95, stockStatus: 'in', lotNote: null, waterAbsorptionPct: 0.12, compressiveStrengthMpa: 195, quarryOrigin: 'Khammam, Telangana' },
    ],
    rateUpdatedDaysAgo: 5,
  },
  {
    slug: 'kashmir-white-granite', nameEn: 'Kashmir White Granite', nameBn: 'কাশ্মীর হোয়াইট গ্রানাইট',
    sku: 'RM-GRN-SLB-KW', category: 'c-granite', material: 'granite', size: 'slab',
    finish: 'polished', colours: ['white', 'grey'], hex: '#ded9cf', rate: 128, pricingUnit: 'slab',
    band: 'premium', apps: ['floor', 'kitchen'], weight: 3.2,
    shadeNote: 'Natural raised — shade and grain vary by block.',
    rateUpdatedDaysAgo: 14,
  },
  {
    slug: 'tan-brown-granite', nameEn: 'Tan Brown Granite', nameBn: 'ট্যান ব্রাউন গ্রানাইট',
    sku: 'RM-GRN-SLB-TB', category: 'c-granite', material: 'granite', size: 'slab',
    finish: 'polished', colours: ['brown', 'black'], hex: '#5c3f36', rate: 124, pricingUnit: 'slab',
    band: 'premium', apps: ['kitchen', 'floor', 'stairs'], weight: 3.3,
    shadeNote: 'Natural raised — shade and grain vary by block.',
    rateUpdatedDaysAgo: 7,
  },

  // ---- Ceramic floor -----------------------------------------------------
  {
    slug: 'accent-rustic-ceramic', nameEn: 'Terracotta Rustic Ceramic', nameBn: 'টেরাকোটা রাস্টিক',
    sku: 'RM-CER-3030-TR', category: 'c-ceramic', material: 'ceramic', size: '300x300',
    finish: 'matt', colours: ['brown', 'multi'], hex: '#b16a45', rate: 34,
    band: 'economy', apps: ['floor', 'outdoor'], featured: true, rateUpdatedDaysAgo: 10,
    appNote: 'Verandas, courtyards and utility areas. Warm underfoot, forgiving of dust.',
  },
  {
    slug: 'clay-red-ceramic', nameEn: 'Clay Red Ceramic', nameBn: 'ক্লে রেড সেরামিক',
    sku: 'RM-CER-4040-CR', category: 'c-ceramic', material: 'ceramic', size: '400x400',
    finish: 'rustic', colours: ['brown'], hex: '#a35a3c', rate: 31, band: 'economy',
    apps: ['floor', 'outdoor'], rateUpdatedDaysAgo: 22,
  },
  {
    slug: 'slate-grey-ceramic', nameEn: 'Slate Grey Ceramic', nameBn: 'স্লেট গ্রে সেরামিক',
    sku: 'RM-CER-4040-SG', category: 'c-ceramic', material: 'ceramic', size: '400x400',
    finish: 'matt', colours: ['grey', 'black'], hex: '#6f6f6d', rate: 36, band: 'economy',
    apps: ['floor', 'bathroom'], rateUpdatedDaysAgo: 16,
  },
  {
    slug: 'sand-beige-ceramic', nameEn: 'Sand Beige Ceramic', nameBn: 'স্যান্ড বেইজ সেরামিক',
    sku: 'RM-CER-3030-SB', category: 'c-ceramic', material: 'ceramic', size: '300x300',
    finish: 'anti_skid', colours: ['beige'], hex: '#d3bf9b', rate: 38, band: 'economy',
    apps: ['bathroom', 'floor'], rateUpdatedDaysAgo: 13,
    appNote: 'Anti-skid surface — safe for a bathroom or wash area floor.',
  },

  // ---- Wall tile ---------------------------------------------------------
  {
    slug: 'pearl-white-wall', nameEn: 'Pearl White Wall Tile', nameBn: 'পার্ল হোয়াইট ওয়াল টাইল',
    sku: 'RM-WAL-3060-PW', category: 'c-wall', material: 'ceramic', size: '300x600',
    finish: 'glossy', colours: ['white'], hex: '#f1efe9', rate: 29, band: 'economy',
    apps: ['wall', 'bathroom', 'kitchen'], featured: true, weight: 1.4, rateUpdatedDaysAgo: 5,
    appNote: 'Bathroom and kitchen walls. Wall tile is thinner than floor tile — never lay it on a floor.',
  },
  {
    slug: 'mint-subway-wall', nameEn: 'Mint Subway Wall Tile', nameBn: 'মিন্ট সাবওয়ে',
    sku: 'RM-WAL-3060-MS', category: 'c-wall', material: 'ceramic', size: '300x600',
    finish: 'glossy', colours: ['multi', 'white'], hex: '#cfdcd2', rate: 42, band: 'value',
    apps: ['wall', 'kitchen'], weight: 1.4, rateUpdatedDaysAgo: 19,
  },
  {
    slug: 'marble-look-wall', nameEn: 'Marble Look Wall Tile', nameBn: 'মার্বেল লুক ওয়াল টাইল',
    sku: 'RM-WAL-3060-ML', category: 'c-wall', material: 'ceramic', size: '300x600',
    finish: 'glossy', colours: ['white', 'grey'], hex: '#eae7e1', rate: 46, band: 'value',
    apps: ['wall', 'bathroom'], weight: 1.4, rateUpdatedDaysAgo: 6,
  },
  {
    slug: 'charcoal-dado-wall', nameEn: 'Charcoal Dado Wall Tile', nameBn: 'চারকোল ড্যাডো',
    sku: 'RM-WAL-3060-CD', category: 'c-wall', material: 'ceramic', size: '300x600',
    finish: 'matt', colours: ['black', 'grey'], hex: '#42403d', rate: 44, band: 'value',
    apps: ['wall', 'bathroom'], weight: 1.4, stock: 'on_order', rateUpdatedDaysAgo: 25,
  },

  // ---- Outdoor / parking -------------------------------------------------
  {
    slug: 'beige-sandstone-outdoor', nameEn: 'Beige Sandstone Outdoor', nameBn: 'বেইজ স্যান্ডস্টোন',
    sku: 'RM-OUT-6090-BS', category: 'c-outdoor', material: 'vitrified', size: '600x900',
    finish: 'anti_skid', colours: ['beige'], hex: '#cfb896', rate: 68, band: 'value',
    apps: ['outdoor', 'parking'], featured: true, weight: 2.4, rateUpdatedDaysAgo: 3,
    appNote: 'Rated for parking. Anti-skid surface holds grip in the monsoon.',
  },
  {
    slug: 'granite-finish-parking', nameEn: 'Granite Finish Parking Tile', nameBn: 'গ্রানাইট ফিনিশ পার্কিং',
    sku: 'RM-OUT-4040-GP', category: 'c-outdoor', material: 'ceramic', size: '400x400',
    finish: 'rustic', colours: ['grey', 'brown'], hex: '#8a7f72', rate: 44, band: 'economy',
    apps: ['parking', 'outdoor'], weight: 2.6, rateUpdatedDaysAgo: 9,
    appNote: 'Heavy-duty body for vehicle load. This is the one to use under a car, not a floor tile.',
  },
  {
    slug: 'cobble-grey-outdoor', nameEn: 'Cobble Grey Outdoor', nameBn: 'কবল গ্রে আউটডোর',
    sku: 'RM-OUT-3030-CG', category: 'c-outdoor', material: 'ceramic', size: '300x300',
    finish: 'rustic', colours: ['grey'], hex: '#7d7b77', rate: 39, band: 'economy',
    apps: ['outdoor', 'parking'], weight: 2.5, stock: 'low', rateUpdatedDaysAgo: 28,
  },

  // ---- Stairs / riser ----------------------------------------------------
  {
    slug: 'granite-step-tread', nameEn: 'Granite Step & Riser Set', nameBn: 'গ্রানাইট স্টেপ ও রাইজার',
    sku: 'RM-STR-SLB-GS', category: 'c-stairs', material: 'granite', size: 'slab',
    finish: 'polished', colours: ['black', 'grey'], hex: '#3a3836', rate: 156, pricingUnit: 'slab',
    band: 'premium', apps: ['stairs'], weight: 3.3,
    shadeNote: 'Natural raised — shade and grain vary by block.',
    appNote: 'Sold as a tread-and-riser set, cut to your stair width at the shop.',
    rateUpdatedDaysAgo: 4,
  },
  {
    slug: 'wood-look-riser', nameEn: 'Wood Look Step Tile', nameBn: 'উড লুক স্টেপ টাইল',
    sku: 'RM-STR-3012-WL', category: 'c-stairs', material: 'other', size: '300x1200',
    finish: 'matt', colours: ['wood', 'brown'], hex: '#a87a4e', rate: 92, band: 'premium',
    apps: ['stairs'], weight: 2.1, rateUpdatedDaysAgo: 17,
  },
  {
    slug: 'kota-blue-stairs', nameEn: 'Kota Blue Stone', nameBn: 'কোটা ব্লু স্টোন',
    sku: 'RM-STR-SLB-KB', category: 'c-stairs', material: 'other', size: 'slab',
    finish: 'honed', colours: ['grey', 'black'], hex: '#5d6b6e', rate: 64, pricingUnit: 'slab',
    band: 'value', apps: ['stairs', 'outdoor', 'floor'], weight: 3.0,
    shadeNote: 'Natural raised — shade varies slab to slab.',
    rateUpdatedDaysAgo: 20,
  },
];

const daysAgo = (n: number) =>
  new Date(Date.UTC(2026, 8, 19) - n * 86400000).toISOString();

function build(seed: Seed, i: number): Product {
  const unit = seed.pricingUnit ?? 'box';
  const box = BOX_SPEC[seed.size];
  const id = 'p-' + seed.slug;

  const images = (['flat', 'context', 'scale'] as const).map((type, n) => ({
    id: id + '-img-' + n,
    cdnPublicId: 'roman-marbel/' + seed.slug + '/' + type,
    type,
    sortOrder: n,
    altEn:
      type === 'flat' ? seed.nameEn + ' close-up, ' + seed.size
        : type === 'context' ? seed.nameEn + ' laid as a floor'
        : seed.nameEn + ' edge showing thickness',
    altBn: seed.nameBn,
  }));

  const variants: ProductVariant[] = (seed.variants ?? []).map((v, n) => ({
    ...v,
    id: id + '-v-' + n,
    productId: id,
  }));

  return {
    id,
    sku: seed.sku,
    nameEn: seed.nameEn,
    nameBn: seed.nameBn,
    slug: seed.slug,
    categoryId: seed.category,
    material: seed.material,
    sizeMm: seed.size === 'slab' ? 'Slab' : seed.size,
    finish: seed.finish,
    colourFamily: seed.colours,
    colourHexPrimary: seed.hex,
    pricingUnit: unit,
    ratePerSqft: seed.rate,
    mrpPerSqft: seed.mrp ?? null,
    piecesPerBox: unit === 'box' ? box?.pieces ?? 4 : null,
    sqftPerBox: unit === 'box' ? box?.sqft ?? 15.5 : null,
    weightPerSqft: seed.weight ?? 2.0,
    stockStatus: seed.stock ?? 'in',
    budgetBand: seed.band,
    application: seed.apps.filter((a) =>
      ['floor', 'wall', 'bathroom', 'kitchen', 'outdoor', 'stairs', 'parking'].includes(a),
    ) as Application[],
    isPublished: true,
    isFeatured: seed.featured ?? false,
    shadeVariationNote:
      seed.shadeNote ??
      (seed.material === 'marble' || seed.material === 'granite'
        ? 'Natural raised — shade may vary by batch.'
        : null),
    rateUpdatedAt: daysAgo(seed.rateUpdatedDaysAgo ?? 10 + (i % 30)),
    images,
    variants,
    careNote: seed.care,
    applicationNote: seed.appNote,
  };
}

export const PRODUCTS: Product[] = SEEDS.map(build);

/**
 * Maps a room type to the products that suit it. Room is customer language;
 * `application` is the stored field (PRD §13).
 */
export const ROOM_APPLICATION: Record<string, Application[]> = {
  living: ['floor'],
  bedroom: ['floor'],
  kitchen: ['kitchen', 'wall'],
  bathroom: ['bathroom'],
  stairs: ['stairs'],
  outdoor: ['outdoor', 'parking'],
  wall: ['wall'],
};
