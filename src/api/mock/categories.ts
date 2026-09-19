import type { Category, Material, RoomType } from '@/types';

/** PRD F-1.1 — the seven catalogue categories. */
export const CATEGORIES: Category[] = [
  { id: 'c-marble', nameEn: 'Marble', nameBn: 'মার্বেল', slug: 'marble', parentId: null, sortOrder: 1, icon: 'marble' },
  { id: 'c-granite', nameEn: 'Granite', nameBn: 'গ্রানাইট', slug: 'granite', parentId: null, sortOrder: 2, icon: 'granite' },
  { id: 'c-vitrified', nameEn: 'Vitrified', nameBn: 'ভিট্রিফায়েড', slug: 'vitrified', parentId: null, sortOrder: 3, icon: 'tile' },
  { id: 'c-ceramic', nameEn: 'Ceramic Floor', nameBn: 'সেরামিক ফ্লোর', slug: 'ceramic-floor', parentId: null, sortOrder: 4, icon: 'tile' },
  { id: 'c-wall', nameEn: 'Wall Tile', nameBn: 'দেয়ালের টাইল', slug: 'wall-tile', parentId: null, sortOrder: 5, icon: 'wall' },
  { id: 'c-outdoor', nameEn: 'Outdoor / Parking', nameBn: 'বাইরে / পার্কিং', slug: 'outdoor-parking', parentId: null, sortOrder: 6, icon: 'outdoor' },
  { id: 'c-stairs', nameEn: 'Stairs / Riser', nameBn: 'সিঁড়ি', slug: 'stairs-riser', parentId: null, sortOrder: 7, icon: 'stairs' },
];

/**
 * PRD §5 Door B step 1, and the "Shop by space" grid on the Figma landing page.
 * Room type is what the customer actually thinks in — category is trade language.
 */
export const ROOMS: {
  id: RoomType; labelEn: string; labelBn: string; sub: string; applications: string[];
  /** F-3.7 — room presets bias the shortlist toward sensible defaults. */
  prefer: { finish?: string[]; maxSizeMm?: number; note: string };
  /** How this room is previewed in the grid — kept here so Home and the
      wizard cannot drift apart. */
  preview: { material: Material; hex: string };
}[] = [
  {
    preview: { material: 'vitrified', hex: '#efece2' }, id: 'living', labelEn: 'Living Room Floors', labelBn: 'বসার ঘরের মেঝে',
    sub: 'Vitrified · Marble', applications: ['floor'],
    prefer: { note: 'Large format reads calmer in a big room and means fewer grout lines.' },
  },
  {
    preview: { material: 'other', hex: '#b58453' }, id: 'bedroom', labelEn: 'Bedroom Floors', labelBn: 'শোবার ঘরের মেঝে',
    sub: 'Vitrified · Wood look', applications: ['floor'],
    prefer: { note: 'Matt and wood-look finishes feel warmer underfoot than high gloss.' },
  },
  {
    preview: { material: 'ceramic', hex: '#cfdcd2' }, id: 'kitchen', labelEn: 'Kitchen Backsplash', labelBn: 'রান্নাঘরের দেয়াল',
    sub: 'Glossy · Wall', applications: ['kitchen', 'wall'],
    prefer: { finish: ['glossy'], note: 'Glossy wall tile wipes clean; avoid deep texture behind a stove.' },
  },
  {
    preview: { material: 'ceramic', hex: '#d3bf9b' }, id: 'bathroom', labelEn: 'Bathroom Tiles', labelBn: 'বাথরুমের টাইল',
    sub: 'Anti-skid · Ceramic', applications: ['bathroom'],
    prefer: {
      finish: ['anti_skid', 'matt'], maxSizeMm: 600,
      note: 'Anti-skid on the floor is not optional in a wet area. Smaller formats drain better.',
    },
  },
  {
    preview: { material: 'granite', hex: '#3a3836' }, id: 'stairs', labelEn: 'Stairs & Skirting', labelBn: 'সিঁড়ি ও স্কার্টিং',
    sub: 'Matt · Durable', applications: ['stairs'],
    prefer: { note: 'Stair treads take the most wear in the house. Buy the harder material.' },
  },
  {
    preview: { material: 'granite', hex: '#8a7f72' }, id: 'outdoor', labelEn: 'Outdoor & Parking', labelBn: 'বাইরে ও পার্কিং',
    sub: 'Granite · Rough', applications: ['outdoor', 'parking'],
    prefer: {
      finish: ['rustic', 'anti_skid', 'leather'],
      note: 'Parking needs heavy-duty material. A polished floor tile will not survive a car.',
    },
  },
  {
    preview: { material: 'ceramic', hex: '#eae7e1' }, id: 'wall', labelEn: 'Feature Walls', labelBn: 'দেয়ালের কাজ',
    sub: 'Wall · Decorative', applications: ['wall'],
    prefer: { note: 'Wall tile is thinner and lighter than floor tile — do not lay it on a floor.' },
  },
];

export const COLOUR_SWATCHES: { id: string; labelEn: string; labelBn: string; hex: string }[] = [
  { id: 'white', labelEn: 'White', labelBn: 'সাদা', hex: '#f2efe9' },
  { id: 'beige', labelEn: 'Beige', labelBn: 'বেইজ', hex: '#d9c5a6' },
  { id: 'grey', labelEn: 'Grey', labelBn: 'ধূসর', hex: '#9a9791' },
  { id: 'brown', labelEn: 'Brown', labelBn: 'বাদামি', hex: '#7c5a40' },
  { id: 'black', labelEn: 'Black', labelBn: 'কালো', hex: '#2b2926' },
  { id: 'wood', labelEn: 'Wood', labelBn: 'কাঠ', hex: '#b58453' },
  { id: 'multi', labelEn: 'Multi', labelBn: 'মিশ্র', hex: '#4d7cfe' },
];

export const BUDGET_BANDS: { id: string; labelEn: string; labelBn: string; min: number; max: number | null }[] = [
  { id: 'u40', labelEn: 'Under ₹40', labelBn: '₹৪০ এর নিচে', min: 0, max: 40 },
  { id: '40-70', labelEn: '₹40 – ₹70', labelBn: '₹৪০ – ₹৭০', min: 40, max: 70 },
  { id: '70-120', labelEn: '₹70 – ₹120', labelBn: '₹৭০ – ₹১২০', min: 70, max: 120 },
  { id: '120plus', labelEn: '₹120+', labelBn: '₹১২০+', min: 120, max: null },
  { id: 'any', labelEn: 'Not sure, show all', labelBn: 'নিশ্চিত নই, সব দেখান', min: 0, max: null },
];
