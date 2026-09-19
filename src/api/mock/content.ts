/**
 * Trust content — PRD §6.7. Policy copy here is deliberately plain and states
 * the awkward things (breakage, shade variation, what is not returnable) rather
 * than burying them, because those are exactly the complaints this trade runs
 * on (PRD §2.3).
 *
 * Every figure marked OWNER-CONFIRM is a business decision from PRD §15.3, not
 * something engineering should invent. They are surfaced in /admin/settings.
 */

export interface Policy {
  id: string;
  titleEn: string;
  titleBn: string;
  summary: string;
  body: { heading: string; text: string }[];
}

export const POLICIES: Policy[] = [
  {
    id: 'breakage',
    titleEn: 'Breakage in transit',
    titleBn: 'পরিবহনে ভাঙা',
    summary: 'Check every box before the vehicle leaves. We replace what breaks in transit.',
    body: [
      {
        heading: 'Inspect before the vehicle leaves',
        text: 'Tiles are fragile freight. Open and count the boxes while the driver is still at your gate. Once the vehicle leaves, we cannot tell transit damage from site damage, and neither can you.',
      },
      {
        heading: 'Photograph anything broken',
        text: 'Take a photo of the broken pieces next to the delivery challan. Send it on WhatsApp the same day. A photo settles the matter in one message.',
      },
      {
        heading: 'Report within 24 hours',
        text: 'Breakage reported within 24 hours of delivery is replaced free from the same lot where stock allows. After 24 hours we will still look at it, but replacement is at the shop’s discretion.',
      },
      {
        heading: 'Expected breakage',
        text: 'A small amount of edge chipping is normal in tile freight and is one of the reasons the estimate includes wastage. Wastage covers cutting and spares; it is not a breakage allowance.',
      },
    ],
  },
  {
    id: 'shade',
    titleEn: 'Shade & batch variation',
    titleBn: 'শেড ও ব্যাচের পার্থক্য',
    summary: 'Shade varies between batches. Buy your full requirement in one go.',
    body: [
      {
        heading: 'This is normal, not a defect',
        text: 'Tiles are fired in batches and natural raised is cut from different blocks. Two boxes of the same product bought six months apart will not match exactly. No dealer anywhere can promise otherwise.',
      },
      {
        heading: 'Buy the whole requirement at once',
        text: 'This is the single most useful thing on this page. Work out the full quantity for the whole house, including wastage, and buy it in one batch. Running short mid-job is the most common way a floor ends up mismatched.',
      },
      {
        heading: 'Natural raised varies more',
        text: 'Marble and granite vary by block, not just by batch. For slab material, come and pick your slabs at the godown before cutting. We will hold them for you.',
      },
      {
        heading: 'Photos are a guide',
        text: 'We shoot every product under the same light with no filters or enhancement. Even so, a photo on a phone screen is not the material. Ask for a sample piece before committing to a large order.',
      },
    ],
  },
  {
    id: 'returns',
    titleEn: 'Returns & exchange',
    titleBn: 'ফেরত ও বদল',
    summary: 'Unopened full boxes within 7 days. Cut and custom items cannot come back.',
    body: [
      {
        heading: 'What we take back',
        text: 'Full, unopened, undamaged boxes in their original packing, within 7 days of delivery, with the delivery challan. OWNER-CONFIRM: window and restocking fee (PRD Q5).',
      },
      {
        heading: 'What we cannot take back',
        text: 'Opened boxes, loose pieces, anything cut to size, edge-polished, or ordered specially for you. Slab material selected and cut at your instruction is non-returnable once cut.',
      },
      {
        heading: 'Exchange is easier than return',
        text: 'If the shade is not what you expected, talk to us before you lay anything. An exchange against a different product is usually simpler for both sides than a refund.',
      },
    ],
  },
  {
    id: 'delivery',
    titleEn: 'Delivery',
    titleBn: 'ডেলিভারি',
    summary: 'Zone A free above a threshold, Zone B flat per trip, Zone C quoted per order.',
    body: [
      {
        heading: 'How delivery is charged',
        text: 'Delivery cost in this trade is distance and tonnage, not order value alone. We publish zones rather than promise free delivery everywhere, because a free-delivery-everywhere promise gets paid for somewhere — usually in the rate.',
      },
      {
        heading: 'Ground floor, at your gate',
        text: 'The quoted delivery brings the material to your gate at ground level. Carrying up to a first or second floor is arranged separately with the labour — tell us in advance so we send enough hands.',
      },
      {
        heading: 'Large orders',
        text: 'Above roughly three tonnes the app stops calculating and the shop quotes the trip directly. That is deliberate. A guessed freight figure on a big order is how an estimate ends up 30% wrong.',
      },
      {
        heading: 'Access',
        text: 'Tell us if the approach is narrow or unmetalled. A truck that cannot reach the site is a wasted trip that someone has to pay for.',
      },
    ],
  },
  {
    id: 'privacy',
    titleEn: 'Privacy',
    titleBn: 'গোপনীয়তা',
    summary: 'Your phone number is used to call you back about your enquiry. Nothing else.',
    body: [
      {
        heading: 'What we collect',
        text: 'Your name, phone number and PIN code when you send an enquiry, and the estimate attached to it. That is all. We do not ask for an email address and we do not need one.',
      },
      {
        heading: 'What we do with it',
        text: 'We call or WhatsApp you about your enquiry and, if you order, about your delivery. We do not sell it, share it with any third party, or add you to a marketing list.',
      },
      {
        heading: 'Your rights',
        text: 'Under the Digital Personal Data Protection Act 2023 you can ask us to delete your data at any time. Call or WhatsApp the shop and we will remove it.',
      },
      {
        heading: 'How long we keep it',
        text: 'Anonymous estimates are cleared after 30 days. Enquiries are kept 24 months. Order records are kept as long as tax law requires.',
      },
    ],
  },
];

export interface Guide {
  id: string;
  titleEn: string;
  titleBn: string;
  minutes: number;
  teaser: string;
  body: { heading: string; text: string }[];
}

/** PRD F-7.5 — short guides, written to remove anxiety, not to sell. */
export const GUIDES: Guide[] = [
  {
    id: 'measure',
    titleEn: 'How to measure your room',
    titleBn: 'ঘর কীভাবে মাপবেন',
    minutes: 2,
    teaser: 'A tape, two numbers, and one thing most people forget.',
    body: [
      {
        heading: 'Measure the floor, not the walls',
        text: 'Stand in the room and measure the longest side, then the shorter side, at floor level. Write both down in feet and inches. If your room is 12 feet 6 inches by 10 feet, that is what you enter — do not round it to 12 by 10.',
      },
      {
        heading: 'L-shaped rooms: split them',
        text: 'Draw the shape on paper and cut it into two rectangles. Measure each one separately and add both in the calculator using "add another area". That is far more accurate than trying to average an odd shape.',
      },
      {
        heading: 'The thing people forget',
        text: 'Skirting. The strip of tile that runs along the bottom of the wall is priced per running foot, not per square foot, and it is the perimeter of the room — twice the length plus twice the width. The calculator works it out for you if you tick the box.',
      },
      {
        heading: 'Do not deduct small obstructions',
        text: 'A pillar or a cupboard base is not worth deducting. The offcuts around it become the wastage you were going to need anyway.',
      },
    ],
  },
  {
    id: 'wastage',
    titleEn: 'How much wastage to keep',
    titleBn: 'কত অপচয় ধরবেন',
    minutes: 2,
    teaser: 'Why 8% is the default, and when you should raise it.',
    body: [
      {
        heading: 'What wastage actually covers',
        text: 'Tiles cut at the edges of the room, the odd piece that breaks while laying, and a few spare tiles kept aside for future repair. It is not padding. Every floor needs it.',
      },
      {
        heading: 'The numbers',
        text: 'A simple rectangular room with large tiles: 8%. A room with many cuts, an L-shape or pillars: 10 to 12%. Diagonal or patterned laying: 12 to 15%. Small format or mosaic: 10%. Natural marble and granite slab: 12% and up, confirmed at the shop.',
      },
      {
        heading: 'Keep the spares',
        text: 'Store four or five spare tiles in a dry corner. In five years when one cracks, you will not find the same batch in any shop — including ours. Those spares are the only exact match that will ever exist.',
      },
      {
        heading: 'Running short is the expensive mistake',
        text: 'Under-ordering by half a box means a second trip, a second delivery charge, and a batch that may not match. Over-ordering by half a box means you have spares. The maths is not symmetrical.',
      },
    ],
  },
  {
    id: 'matt-glossy',
    titleEn: 'Matt or glossy?',
    titleBn: 'ম্যাট না গ্লসি?',
    minutes: 2,
    teaser: 'Not a style question. It is about light, dust and bare feet.',
    body: [
      {
        heading: 'Glossy',
        text: 'Reflects light, so a small or north-facing room feels bigger and brighter. Shows every footprint and water spot. Slippery when wet. Best in living rooms and bedrooms that stay dry.',
      },
      {
        heading: 'Matt',
        text: 'Hides dust and footprints, feels warmer underfoot, and is far safer where water lands. Colours read slightly deeper. Best for kitchens, passages, and any house with small children or elderly parents.',
      },
      {
        heading: 'A common mix',
        text: 'Glossy in the drawing room where guests sit, matt everywhere else. Nobody will notice the change; everyone notices a slippery kitchen floor.',
      },
    ],
  },
  {
    id: 'anti-skid',
    titleEn: 'Anti-skid for bathrooms',
    titleBn: 'বাথরুমে অ্যান্টি-স্কিড',
    minutes: 2,
    teaser: 'The one place not to save money.',
    body: [
      {
        heading: 'Why it matters more than the look',
        text: 'A wet polished floor in a bathroom is genuinely dangerous, particularly for elderly parents. Anti-skid tile has a textured surface that keeps grip under water. It costs a few rupees more per square foot.',
      },
      {
        heading: 'Smaller is better here',
        text: 'A smaller tile means more grout lines, and grout lines give grip and let water run to the drain. A large-format tile in a small bathroom looks good in a photo and drains badly in practice.',
      },
      {
        heading: 'Floor and wall are different tiles',
        text: 'Wall tile is thinner and lighter and is not rated for walking on. Never put wall tile on a bathroom floor, whatever it costs.',
      },
    ],
  },
];

/** PRD F-7.3 — real floors in real local homes, product tagged. */
export const GALLERY = [
  { id: 'g1', place: 'Memari', room: 'Living room', productSlug: 'carrara-white-vitrified', sqft: 480, note: 'Two-storey house, ground floor throughout.' },
  { id: 'g2', place: 'Bardhaman town', room: 'Kitchen platform', productSlug: 'absolute-black-granite', sqft: 42, note: 'L-shaped platform with a 4-inch skirting.' },
  { id: 'g3', place: 'Jamalpur', room: 'Bedroom', productSlug: 'oak-wood-plank-vitrified', sqft: 165, note: 'Laid in a stagger pattern.' },
  { id: 'g4', place: 'Kalna', room: 'Bathroom', productSlug: 'sand-beige-ceramic', sqft: 58, note: 'Anti-skid floor with a matching dado.' },
  { id: 'g5', place: 'Raina', room: 'Veranda', productSlug: 'accent-rustic-ceramic', sqft: 210, note: 'Open veranda, full sun.' },
  { id: 'g6', place: 'Memari', room: 'Staircase', productSlug: 'granite-step-tread', sqft: 96, note: '16 steps, tread and riser cut to size.' },
  { id: 'g7', place: 'Bhatar', room: 'Parking', productSlug: 'granite-finish-parking', sqft: 340, note: 'Two-car parking, heavy-duty body.' },
  { id: 'g8', place: 'Memari', room: 'Drawing room', productSlug: 'statuario-gold-vitrified', sqft: 320, note: '800×800 large format, minimal joints.' },
];

/**
 * PRD F-7.4 — Google reviews. These are placeholders with a clearly marked
 * source; PRD R10 is explicit that fabricated social proof must not ship. In
 * production this component renders the Google Places response or renders
 * nothing at all.
 */
export const REVIEWS_PLACEHOLDER = {
  connected: false,
  note: 'Google reviews are not connected yet. This section stays empty until the Google Business Profile is linked — the shop will not show reviews it cannot prove.',
};
