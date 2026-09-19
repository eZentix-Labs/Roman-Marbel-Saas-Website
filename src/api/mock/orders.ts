import type { Order } from '@/types';

/**
 * Seed orders for the F-9.1 phone-lookup tracker. In production these come from
 * GET /api/v1/orders?phone=&otp_token=. The timeline is an append-only event
 * log (TRD §4 order_status_event), so each reached step carries its own
 * timestamp and unreached steps are simply absent.
 *
 * Demo lookup: any of the phone numbers below, with OTP 123456.
 */

const iso = (d: number, h = 10, m = 0) =>
  new Date(Date.UTC(2026, 8, d, h - 5, m - 30)).toISOString();

export const ORDERS: Order[] = [
  {
    id: 'o-1',
    orderCode: 'RM-2409-118',
    phone: '9876543210',
    customerName: 'Sujata Mondal',
    lines: [
      {
        productName: 'Carrara White Vitrified', sizeMm: '600x600', boxes: 34,
        sqft: 527, rate: 52, lineTotal: 27404, imageSeed: 'roman-marbel/carrara-white-vitrified/flat',
      },
      {
        productName: 'Pearl White Wall Tile', sizeMm: '300x600', boxes: 9,
        sqft: 104.67, rate: 29, lineTotal: 3035, imageSeed: 'roman-marbel/pearl-white-wall/flat',
      },
    ],
    quotedTotal: 36500,
    finalTotal: 35958,
    advancePaid: 5000,
    paymentStatus: 'advance_paid',
    deliveryStatus: 'out_for_delivery',
    deliveryAddress: 'Vill. Nabastha, Memari, Purba Bardhaman — 713407',
    expectedDate: iso(21, 14),
    vehicleNote: 'Tata 709 · WB 41 C 2284 · driver Sk. Alam, 98301 xxxxx',
    timeline: [
      { status: 'confirmed', note: 'Advance ₹5,000 received via UPI', occurredAt: iso(16, 11, 20) },
      { status: 'packed', note: '43 boxes packed and checked for breakage', occurredAt: iso(19, 9, 45) },
      { status: 'out_for_delivery', note: 'Left the godown', occurredAt: iso(21, 8, 10) },
      { status: 'delivered', note: '', occurredAt: null },
    ],
    createdAt: iso(16, 11, 20),
  },
  {
    id: 'o-2',
    orderCode: 'RM-1209-094',
    phone: '9876543210',
    customerName: 'Sujata Mondal',
    lines: [
      {
        productName: 'Absolute Black Granite', sizeMm: 'Slab', boxes: null,
        sqft: 46.2, rate: 142, lineTotal: 6560, imageSeed: 'roman-marbel/absolute-black-granite/flat',
      },
    ],
    quotedTotal: 7800,
    finalTotal: 7741,
    advancePaid: 7741,
    paymentStatus: 'paid_in_full',
    deliveryStatus: 'delivered',
    deliveryAddress: 'Vill. Nabastha, Memari, Purba Bardhaman — 713407',
    expectedDate: iso(14, 12),
    vehicleNote: null,
    timeline: [
      { status: 'confirmed', note: 'Kitchen platform, cut to size', occurredAt: iso(10, 10, 5) },
      { status: 'packed', note: 'Cut and edge-polished', occurredAt: iso(13, 16, 30) },
      { status: 'out_for_delivery', note: '', occurredAt: iso(14, 9, 0) },
      { status: 'delivered', note: 'Received and signed for', occurredAt: iso(14, 12, 40) },
    ],
    createdAt: iso(10, 10, 5),
  },
  {
    id: 'o-3',
    orderCode: 'RM-1809-106',
    phone: '9123456780',
    customerName: 'Sk. Rafiq',
    lines: [
      {
        productName: 'Graphite Grey Vitrified', sizeMm: '600x600', boxes: 58,
        sqft: 899, rate: 58, lineTotal: 52142, imageSeed: 'roman-marbel/graphite-grey-vitrified/flat',
      },
      {
        productName: 'Beige Sandstone Outdoor', sizeMm: '600x900', boxes: 16,
        sqft: 279.04, rate: 68, lineTotal: 18975, imageSeed: 'roman-marbel/beige-sandstone-outdoor/flat',
      },
    ],
    quotedTotal: 84000,
    finalTotal: 83898,
    advancePaid: 20000,
    paymentStatus: 'advance_paid',
    deliveryStatus: 'packed',
    deliveryAddress: 'Site 2, Jamalpur, Purba Bardhaman — 713408',
    expectedDate: iso(23, 11),
    vehicleNote: null,
    timeline: [
      { status: 'confirmed', note: 'Trade rate applied · 3-site project', occurredAt: iso(18, 15, 10) },
      { status: 'packed', note: '74 boxes staged for dispatch', occurredAt: iso(20, 17, 25) },
      { status: 'out_for_delivery', note: '', occurredAt: null },
      { status: 'delivered', note: '', occurredAt: null },
    ],
    createdAt: iso(18, 15, 10),
  },
];

export const ORDER_STEPS = [
  { status: 'confirmed', labelEn: 'Order received', labelBn: 'অর্ডার পাওয়া গেছে' },
  { status: 'packed', labelEn: 'Cutting / prep', labelBn: 'কাটা ও প্রস্তুতি' },
  { status: 'out_for_delivery', labelEn: 'Out for delivery', labelBn: 'ডেলিভারিতে' },
  { status: 'delivered', labelEn: 'Delivered', labelBn: 'পৌঁছে গেছে' },
] as const;
