/**
 * PRD N-2.1/N-2.2 — English and Bengali, switchable, choice remembered.
 *
 * The Bengali here is written, not machine-translated, and uses the words this
 * trade actually uses in Bardhaman rather than formal register. N-2.2 requires
 * the owner to review every trade term before launch: the keys below marked
 * OWNER-REVIEW are the ones where the shop's own wording matters more than
 * dictionary correctness.
 *
 * N-2.3 is enforced structurally — no number, rate or dimension is ever put in
 * this file. Those come from lib/format.ts in Latin numerals in both languages.
 */

export type Lang = 'en' | 'bn';

export const STRINGS = {
  // --- chrome -------------------------------------------------------------
  appName: { en: 'Roman Marbel', bn: 'রোমান মার্বেল' },
  tagline: { en: 'Marble · Granite · Vitrified tiles', bn: 'মার্বেল · গ্রানাইট · ভিট্রিফায়েড টাইল' },
  back: { en: 'Back', bn: 'পিছনে' },
  next: { en: 'Next', bn: 'পরবর্তী' },
  skip: { en: 'Skip', bn: 'বাদ দিন' },
  done: { en: 'Done', bn: 'হয়ে গেছে' },
  cancel: { en: 'Cancel', bn: 'বাতিল' },
  save: { en: 'Save', bn: 'সেভ করুন' },
  close: { en: 'Close', bn: 'বন্ধ করুন' },
  apply: { en: 'Apply', bn: 'প্রয়োগ করুন' },
  clear: { en: 'Clear', bn: 'মুছুন' },
  loading: { en: 'Loading…', bn: 'আসছে…' },
  retry: { en: 'Try again', bn: 'আবার চেষ্টা করুন' },
  call: { en: 'Call the shop', bn: 'দোকানে ফোন করুন' },
  whatsapp: { en: 'WhatsApp', bn: 'হোয়াটসঅ্যাপ' },

  // --- home ---------------------------------------------------------------
  homeHeadline: {
    en: 'Flooring, priced honestly.',
    bn: 'মেঝের দাম, সৎভাবে।',
  },
  homeSub: {
    en: 'See the full range with rates, and get an exact quantity for your room — boxes, wastage, delivery and GST included.',
    bn: 'রেট সহ পুরো সংগ্রহ দেখুন, আর আপনার ঘরের জন্য সঠিক পরিমাণ জানুন — বাক্স, অপচয়, ডেলিভারি ও জিএসটি সহ।',
  },
  doorABig: { en: 'Browse the collection', bn: 'দেখে নিন' },      // OWNER-REVIEW
  doorASub: { en: 'Photos and rates, everything we stock', bn: 'ছবি আর রেট, যা যা আছে সব' },
  doorBBig: { en: 'Tell us your room', bn: 'আমার ঘরের জন্য' },     // OWNER-REVIEW
  doorBSub: { en: 'Four questions, then your quantity and price', bn: 'চারটি প্রশ্ন, তারপর পরিমাণ ও দাম' },
  tick1: { en: 'Estimate in 30 seconds', bn: '৩০ সেকেন্ডে হিসাব' },
  tick2: { en: 'WhatsApp confirmation', bn: 'হোয়াটসঅ্যাপে নিশ্চিত' },
  tick3: { en: 'Verified stock', bn: 'যাচাই করা স্টক' },
  shopBySpace: { en: 'Shop by space', bn: 'ঘর অনুযায়ী দেখুন' },
  shopBySpaceSub: {
    en: 'Find the right surface for every room',
    bn: 'প্রতিটি ঘরের জন্য সঠিক জিনিস বেছে নিন',
  },
  statSpeed: { en: 'To a full, itemised estimate', bn: 'পুরো বিস্তারিত হিসাব পর্যন্ত' },
  statAccuracy: {
    en: 'Estimate-to-bill accuracy we hold ourselves to',
    bn: 'হিসাব ও বিলের মধ্যে যে নির্ভুলতা আমরা রাখি',
  },
  statDistricts: {
    en: 'Districts covered — Purba & Paschim Bardhaman',
    bn: 'জেলা — পূর্ব ও পশ্চিম বর্ধমান',
  },
  statReply: { en: 'We reply to every WhatsApp enquiry', bn: 'প্রতিটি হোয়াটসঅ্যাপের উত্তর দিই' },
  statSameDay: { en: 'Same day', bn: 'একই দিনে' },
  ctaTitle: { en: 'Not sure how much you need?', bn: 'কতটা লাগবে জানেন না?' },
  ctaBody: {
    en: 'Punch in your room size and walk out with an exact quantity — boxes, wastage, delivery and GST, itemised.',
    bn: 'ঘরের মাপ দিন, সঠিক পরিমাণ পেয়ে যান — বাক্স, অপচয়, ডেলিভারি ও জিএসটি, সব আলাদা করে।',
  },
  openCalculator: { en: 'Open the calculator', bn: 'ক্যালকুলেটর খুলুন' },
  honestTitle: { en: 'Rates on this site are real', bn: 'এই সাইটের রেট আসল' },
  honestBody: {
    en: 'We publish what we charge. The estimate is worked out the same way the bill is, and anything we cannot price honestly — a slab, a long delivery, a large order — says so instead of guessing.',
    bn: 'আমরা যা নিই তাই দেখাই। বিল যেভাবে হয়, হিসাবও সেভাবেই হয়। আর যেটা সৎভাবে দাম বলা যায় না — স্ল্যাব, দূরের ডেলিভারি, বড় অর্ডার — সেটা আন্দাজ না করে বলে দেওয়া হয়।',
  },
  popularWeek: { en: 'Popular this week', bn: 'এই সপ্তাহে জনপ্রিয়' },
  inStockNow: { en: 'In stock now', bn: 'এখন স্টকে আছে' },
  viewCatalogue: { en: 'View full catalogue', bn: 'পুরো ক্যাটালগ দেখুন' },
  deliveryPin: { en: 'Delivery PIN code', bn: 'ডেলিভারি পিন কোড' },
  checkPin: { en: 'Check my area', bn: 'আমার এলাকা দেখুন' },

  // --- catalogue ----------------------------------------------------------
  catalogue: { en: 'Catalogue', bn: 'ক্যাটালগ' },
  filters: { en: 'Filters', bn: 'ফিল্টার' },
  sort: { en: 'Sort', bn: 'সাজান' },
  search: { en: 'Search', bn: 'খুঁজুন' },
  searchPlaceholder: { en: 'Try "kalo marbel" or "bathroom tiles"', bn: 'যেমন "কালো মার্বেল" বা "বাথরুম টাইল"' },
  noResults: { en: 'Nothing matches those filters', bn: 'এই ফিল্টারে কিছু নেই' },
  noResultsHelp: { en: 'Try removing a filter, or call the shop — we may have it without it being listed.', bn: 'একটি ফিল্টার সরিয়ে দেখুন, বা দোকানে ফোন করুন — তালিকায় না থাকলেও থাকতে পারে।' },
  sortRelevance: { en: 'Relevance', bn: 'প্রাসঙ্গিকতা' },
  sortRateAsc: { en: 'Rate: low to high', bn: 'রেট: কম থেকে বেশি' },
  sortRateDesc: { en: 'Rate: high to low', bn: 'রেট: বেশি থেকে কম' },
  sortNewest: { en: 'Newest', bn: 'নতুন' },
  room: { en: 'Room', bn: 'ঘর' },
  colour: { en: 'Colour', bn: 'রঙ' },
  material: { en: 'Material', bn: 'উপাদান' },
  size: { en: 'Size', bn: 'মাপ' },
  finish: { en: 'Finish', bn: 'ফিনিশ' },
  budget: { en: 'Budget per sq ft', bn: 'প্রতি বর্গফুট বাজেট' },
  inStockOnly: { en: 'In stock only', bn: 'শুধু স্টকে আছে' },
  compare: { en: 'Compare', bn: 'তুলনা করুন' },

  // --- product ------------------------------------------------------------
  calculateForRoom: { en: 'Calculate for my room', bn: 'আমার ঘরের হিসাব করুন' },  // OWNER-REVIEW
  details: { en: 'Details', bn: 'বিস্তারিত' },
  piecesPerBox: { en: 'Pieces per box', bn: 'প্রতি বাক্সে টুকরো' },
  sqftPerBox: { en: 'Sq ft per box', bn: 'প্রতি বাক্সে বর্গফুট' },
  application: { en: 'Where to use', bn: 'কোথায় ব্যবহার' },
  care: { en: 'Care', bn: 'যত্ন' },
  thickness: { en: 'Thickness', bn: 'পুরুত্ব' },
  askSample: { en: 'Ask for a sample piece', bn: 'একটি নমুনা টুকরো চান' },
  requestRestock: { en: 'Tell me when it arrives', bn: 'এলে আমাকে জানান' },
  outOfStockTitle: { en: 'Out of stock right now', bn: 'এখন স্টক নেই' },
  outOfStockBody: {
    en: 'We will call you when the next lot reaches the godown. No obligation.',
    bn: 'পরের লট গুদামে এলে আমরা ফোন করব। কোনো বাধ্যবাধকতা নেই।',
  },
  shadeVaries: { en: 'Shade may vary by batch', bn: 'ব্যাচ অনুযায়ী শেড আলাদা হতে পারে' },
  similar: { en: 'Similar in this range', bn: 'একই ধরনের অন্য কিছু' },
  technicalSpecs: { en: 'Stone specification', bn: 'পাথরের বিবরণ' },
  waterAbsorption: { en: 'Water absorption', bn: 'জল শোষণ' },
  compressiveStrength: { en: 'Compressive strength', bn: 'চাপ সহনক্ষমতা' },
  quarryOrigin: { en: 'Quarry', bn: 'খনি' },

  // --- wizard -------------------------------------------------------------
  wizardTitle: { en: 'Tell us your room', bn: 'আপনার ঘরের কথা বলুন' },
  stepRoom: { en: 'Which room?', bn: 'কোন ঘর?' },
  stepSize: { en: 'How big is it?', bn: 'কত বড়?' },
  stepColour: { en: 'What colour or look?', bn: 'কী রঙ বা চেহারা?' },
  stepBudget: { en: 'Budget per sq ft?', bn: 'প্রতি বর্গফুট বাজেট?' },
  length: { en: 'Length', bn: 'লম্বা' },
  width: { en: 'Width', bn: 'চওড়া' },
  feet: { en: 'feet', bn: 'ফুট' },
  inches: { en: 'inches', bn: 'ইঞ্চি' },
  metres: { en: 'metres', bn: 'মিটার' },
  addAnotherArea: { en: 'Add another area', bn: 'আরেকটি জায়গা যোগ করুন' },
  removeArea: { en: 'Remove', bn: 'সরান' },
  lShaped: { en: 'L-shaped? Add it as two rectangles.', bn: 'L আকৃতির? দুটি আয়তক্ষেত্র হিসেবে যোগ করুন।' },
  showMatches: { en: 'Show my matches', bn: 'আমার জন্য দেখান' },
  shortlistTitle: { en: 'Matches for your room', bn: 'আপনার ঘরের জন্য' },
  shortlistSub: { en: 'Quantity already worked out for each one.', bn: 'প্রতিটির পরিমাণ হিসাব করাই আছে।' },

  // --- estimate -----------------------------------------------------------
  estimate: { en: 'Estimate', bn: 'হিসাব' },
  yourEstimate: { en: 'Your estimate', bn: 'আপনার হিসাব' },
  estimateDisclaimer: {
    en: 'Estimate — final rate confirmed by shop',
    bn: 'আনুমানিক হিসাব — চূড়ান্ত রেট দোকানে নিশ্চিত হবে',
  },
  floorArea: { en: 'Floor area', bn: 'মেঝের মাপ' },
  withWastage: { en: 'With wastage', bn: 'অপচয় সহ' },
  wastage: { en: 'Wastage', bn: 'অপচয়' },
  wastageHelp: {
    en: 'Extra tiles for cutting at the edges, and spares kept for future repair.',
    bn: 'ধার কাটার জন্য বাড়তি টাইল, আর ভবিষ্যতে মেরামতের জন্য কিছু বাড়তি।',
  },
  boxesNeeded: { en: 'Boxes needed', bn: 'কত বাক্স লাগবে' },
  actualPurchased: { en: 'You actually buy', bn: 'আসলে কিনছেন' },
  rateApplied: { en: 'Rate applied', bn: 'প্রযোজ্য রেট' },
  materialSubtotal: { en: 'Material', bn: 'মালপত্র' },
  addOns: { en: 'Add-ons', bn: 'অতিরিক্ত' },
  skirting: { en: 'Skirting', bn: 'স্কার্টিং' },
  adhesive: { en: 'Adhesive / cement', bn: 'আঠা / সিমেন্ট' },
  grout: { en: 'Grout', bn: 'গ্রাউট' },
  cutting: { en: 'Cutting charge', bn: 'কাটার খরচ' },
  delivery: { en: 'Delivery', bn: 'ডেলিভারি' },
  deliveryQuoted: { en: 'Quoted by the shop', bn: 'দোকান থেকে জানানো হবে' },
  gst: { en: 'GST', bn: 'জিএসটি' },
  total: { en: 'Estimated total', bn: 'আনুমানিক মোট' },
  sendEnquiry: { en: 'Send enquiry on WhatsApp', bn: 'হোয়াটসঅ্যাপে পাঠান' },
  saveShare: { en: 'Save / share estimate', bn: 'হিসাব সেভ বা শেয়ার করুন' },
  addToMyHouse: { en: 'Add to My House', bn: 'আমার বাড়িতে যোগ করুন' },
  myHouse: { en: 'My House', bn: 'আমার বাড়ি' },
  myHouseSub: { en: 'Different tiles for different rooms, one total.', bn: 'আলাদা ঘরে আলাদা টাইল, একটাই মোট।' },
  grandTotal: { en: 'Grand total', bn: 'সর্বমোট' },
  labourNote: { en: 'Laying labour is arranged separately and is not in this total.', bn: 'বসানোর মজুরি আলাদা, এই হিসাবে নেই।' },

  // --- enquiry ------------------------------------------------------------
  enquiryTitle: { en: 'Send this to the shop', bn: 'দোকানে পাঠান' },
  yourName: { en: 'Your name', bn: 'আপনার নাম' },
  phoneNumber: { en: 'Mobile number', bn: 'মোবাইল নম্বর' },
  pinCode: { en: 'PIN code', bn: 'পিন কোড' },
  contactTime: { en: 'Best time to call', bn: 'কখন ফোন করব' },
  anytime: { en: 'Anytime', bn: 'যেকোনো সময়' },
  morning: { en: 'Morning', bn: 'সকাল' },
  afternoon: { en: 'Afternoon', bn: 'দুপুর' },
  evening: { en: 'Evening', bn: 'সন্ধ্যা' },
  sendOtp: { en: 'Send code', bn: 'কোড পাঠান' },
  enterOtp: { en: 'Enter the 6-digit code', bn: '৬ সংখ্যার কোড দিন' },
  verify: { en: 'Verify', bn: 'যাচাই করুন' },
  consent: {
    en: 'I agree that Roman Marbel may call or WhatsApp me about this enquiry.',
    bn: 'আমি রাজি যে রোমান মার্বেল এই বিষয়ে আমাকে ফোন বা হোয়াটসঅ্যাপ করতে পারে।',
  },
  submitEnquiry: { en: 'Send enquiry', bn: 'পাঠিয়ে দিন' },
  bulkEnquiry: { en: 'Bulk / project enquiry', bn: 'বড় বা প্রকল্পের জন্য' },
  siteMeasurement: { en: 'Request site measurement', bn: 'সাইট মাপার অনুরোধ' },
  confirmTitle: { en: 'Sent. We will call you.', bn: 'পাঠানো হয়েছে। আমরা ফোন করব।' },
  yourReference: { en: 'Your reference number', bn: 'আপনার রেফারেন্স নম্বর' },
  whatHappensNext: { en: 'What happens next', bn: 'এরপর কী হবে' },

  // --- orders -------------------------------------------------------------
  orders: { en: 'Orders', bn: 'অর্ডার' },
  trackOrder: { en: 'Track order', bn: 'অর্ডার দেখুন' },
  active: { en: 'Active', bn: 'চলছে' },
  completed: { en: 'Completed', bn: 'শেষ' },
  orderCode: { en: 'Order code', bn: 'অর্ডার নম্বর' },
  expectedDate: { en: 'Expected', bn: 'আশা করা হচ্ছে' },
  advancePaid: { en: 'Advance paid', bn: 'অগ্রিম দেওয়া' },
  balanceDue: { en: 'Balance due', bn: 'বাকি' },
  paidInFull: { en: 'Paid in full', bn: 'পুরো দেওয়া হয়েছে' },
  askAboutOrder: { en: 'Ask about this order', bn: 'এই অর্ডার নিয়ে জিজ্ঞাসা' },
  orderAgain: { en: 'Order again', bn: 'আবার অর্ডার করুন' },

  // --- store / trust ------------------------------------------------------
  store: { en: 'Visit the shop', bn: 'দোকানে আসুন' },
  directions: { en: 'Get directions', bn: 'রাস্তা দেখুন' },
  hours: { en: 'Open', bn: 'খোলা' },
  policies: { en: 'Policies', bn: 'নিয়মকানুন' },
  guides: { en: 'Guides', bn: 'গাইড' },
  gallery: { en: 'Work gallery', bn: 'কাজের ছবি' },
  minRead: { en: 'min read', bn: 'মিনিট পড়া' },
} as const;

export type StringKey = keyof typeof STRINGS;
