# Roman Marbel — mobile web frontend

Mobile-first catalogue, quantity calculator and lead-capture app for a marble,
granite and tiles retailer in Memari, Purba Bardhaman.

Built from `Roman-Marbel-Ecommerce-PRD-v1.0.pdf`, `Roman-Marbel-TRD-v1.0.pdf`
and the Figma landing page (`f43NZBM1drp1NjpCpoKvgl`).

**Frontend only.** There is no backend, no database and no real integrations.
Everything below the UI is a mock layer that mirrors the TRD's API contracts
exactly, so a real service can be dropped in without touching a component.

```bash
npm install
npm run dev        # http://localhost:5178
npm test           # calculator regression suite — 28 tests
npm run typecheck
npm run build
```

---

## Stack

React 18 · Vite · TypeScript (strict) · Tailwind · React Router 6 · Vitest.

This is the MERN frontend you asked for, not the Next.js app the TRD specifies.
One consequence is worth stating plainly: **the PRD's SEO requirements (N-5.1
server-rendered product pages, N-5.2 schema.org markup, N-5.3 location landing
pages) cannot be met by a client-rendered SPA.** PRD G5 treats local search as
free compounding demand, so if SEO matters at launch, this app needs either
prerendering or a move to Next.js. Everything else in both documents is here.

---

## Layout

```
src/
├── lib/
│   ├── calc.ts          ← the pricing engine. Pure. Read this first.
│   ├── calc.test.ts     ← PRD §7.9 worked example + TRD §6.5 edge cases
│   ├── texture.ts       ← stands in for the Cloudinary pipeline (TRD §7)
│   ├── format.ts        ← all number/currency formatting (PRD N-2.3)
│   ├── storage.ts       ← 30-day estimate persistence (F-5.7)
│   └── analytics.ts     ← the TRD §9.5 event set
├── api/
│   ├── client.ts        ← the seam a real backend replaces
│   └── mock/            ← seed catalogue, zones, settings, orders, content
├── types/index.ts       ← mirrors the TRD §4 schema field for field
├── i18n/                ← English + Bengali (N-2.1)
├── state/               ← estimate draft, My House, compare, admin session
├── components/
└── pages/               ← 1 route per PRD §10.5 screen, + admin
```

### The calculation engine

`src/lib/calc.ts` is the one file to review carefully. It implements PRD §7 /
TRD §6 as a pure function — no I/O, no `Date.now()`, no module state — which is
what makes it exhaustively testable. The rules it holds:

- `ceil` on boxes, never round. You cannot buy 0.6 of a box.
- Wastage applies **once** to a product's summed areas, not per area (TRD §6.5).
- Rates come from the catalogue snapshot passed in, never from the client (T2).
- Where it cannot price honestly — slab material, a PIN outside the map, a load
  over the zone ceiling — it returns a warning and refuses to guess, rather than
  producing a confident wrong number.

`npm test` runs the PRD §7.9 worked example (14×12 ft, 600×600 at ₹52, Zone A →
**₹15,944**) plus every edge case in TRD §6.5. All 28 pass. Per TRD §6.6, any
change that moves that number needs justifying in the PR description.

---

## What is implemented

**Customer — all P0 plus the frontend-expressible P1/P2:**

| Area | Requirements |
|---|---|
| Home | Two doors (§5), PIN → zone gate (§2.2), shop-by-space, featured |
| Catalogue | F-2.1 – F-2.7 — 2-col grid, bottom-sheet filters, swatch colour, sort, infinite scroll + skeletons, Banglish search, compare |
| Product | F-4.1 – F-4.7 — **fits one screen, no page scroll**, expandable detail sheet, pinch-zoom viewer, persistent WhatsApp, sample request |
| Variants | F-8.1 – F-8.7 — thickness × finish matrix, unavailable finishes disabled *not hidden*, lot notes, per-variant stock, restock capture, stone specs |
| Wizard | F-3.1 – F-3.7 — 4 steps, one question per screen, ft+in / ft / metres, multi-area, every step skippable and widening |
| Shortlist | F-3.6 — ranked, with boxes and total already worked out per product |
| Estimate | F-5.1 – F-5.8 — full breakdown, editable wastage with the §7.2 table, separable add-ons, delivery by zone, GST, reference number, share |
| My House | F-5.5 — several rooms, each its own product, one grand total |
| Enquiry | F-6.1 – F-6.5 — 4 fields only, OTP gate, DPDP consent, bulk and site-visit routing |
| Orders | F-9.1 – F-9.6 — phone lookup without an account, tabs, step tracker, line items, payment status |
| Trust | F-7.1 – F-7.5 — store page, delivery zones, policies, guides, work gallery |
| Language | N-2.1 – N-2.4 — English/Bengali, remembered, numerals stay Latin |

**Admin (`/admin`, demo `7383695415` / `roman123`)** — A-1.1 – A-3.5 and PRD §8.6:
phone-first shell, 4-field add-product, **inline rate edit** (tap the number,
type, Enter — one `PATCH`, not a full PUT), one-tap stock cycling, bulk rate
change by category, enquiry inbox sorted by lead score, status pipeline with
lost-reason, notes, weekly report, and a settings screen where every business
constant lives (TRD §10.5) so a GST change is an edit, not a deploy.

---

## What is deliberately absent

These are the places where faking it would have been worse than leaving the gap
visible. Each is marked in the UI where a user would hit it.

- **OTP.** `verifyOtp` accepts `123456` and the screen says so. Real delivery
  needs MSG91/Fast2SMS with a DLT-registered template — and TRD T4 warns that
  DLT registration takes 1–3 business days and should start in Phase 0.
- **Razorpay advance payment.** The flow is present up to the hand-off and stops.
  There is no honest way to take money from a frontend.
- **Colour auto-tagging.** Colours are authored in the seed. k-means on upload
  is a server job (TRD §7.3).
- **Image CDN.** `lib/texture.ts` generates deterministic SVG stone textures so
  the photo grid has real visual variety before the Phase 0 photography day.
  `imageUrl()` already takes a context (`thumb`/`hero`/`zoom`/`og`) that maps 1:1
  onto the TRD §7.2 transformation table, so swapping in Cloudinary is one file.
- **"Viewed but never enquired" report.** PRD §8.6 calls it the most
  commercially useful output here, and it needs real page-view data. The screen
  says that rather than showing invented numbers.
- **Google reviews.** Empty until the Business Profile is linked.

### Two things from the reviewed concept were not built, on purpose

PRD **R10** and TRD **T8** both rule these out, and they are build-time gates
rather than design notes:

1. **No fabricated activity signals.** No "active buyers online", no "people
   viewing this", no "someone just ordered" toasts. In a district where the
   owner's name is the brand, a customer noticing fake numbers does lasting
   damage.
2. **No customer-facing Customer/Dealer price toggle.** PRD F-8.6 is explicit:
   a self-service toggle that lets any visitor see the trade rate defeats the
   point of a trade rate. `resolveRate()` resolves it from the account instead.

Relatedly, the Figma trust strip claims *"150+ enquiries served every month"*.
That is a **month-12 target** in PRD §3.3, not something the shop can evidence
today, so it was replaced with figures that are either product facts or stated
commitments.

---

## Design

**Blue-black premium theme, iOS-native feel.** Tokens are semantic
(`ink` / `deep` / `surface` / `raised` / `line` / `hi` / `muted` / `accent`)
rather than colour names, so re-theming is `tailwind.config.js` alone — which
is exactly how the original warm Figma palette was swapped for this one without
touching a component. The Figma values are kept under `colors.figma` for
reference, and the gradients live in `backgroundImage`.

| | |
|---|---|
| Page | `#05070f`, with a fixed 165° premium gradient to `#0d1528` |
| Cards | `#0e1524` plus a 1px inset top highlight — the trick that stops dark cards reading as holes |
| Accent | `#4d7cfe` → `#3f68e0` gradient, with a soft glow on primary buttons |
| Text | `#eef2fb` primary, `#8a96b0` secondary |

**One deliberate exception.** PRD §10.3 warns that saturated chrome next to a
product photo distorts how the customer reads the tile’s shade, and shade is
the purchase decision. So the blue is confined to controls and navigation:
every surface behind or beside a product image stays desaturated near-black,
and any chip that sits *on* a photo (budget badge, compare button, zoom
affordance) uses a fixed black scrim rather than a theme token — otherwise it
would vanish against a white marble.

### iOS conventions applied

- **SF system font stack** throughout, on Apple’s type scale with the negative
  tracking SF Pro Display uses on device. No webfont request.
- **Large titles** on root screens that collapse into the nav bar on scroll.
- **Translucent nav and tab bars** (`backdrop-filter` + saturation), with the
  nav hairline appearing only once content has scrolled under it.
- **Back as chevron + label**, left-aligned, with the title centred.
- **Grouped inset lists** with separators inset from the content edge.
- **Sheets** with a grabber, 22px top radius and a dimmed, blurred backdrop.
- **Switches** replace checkboxes wherever the control means on/off.
- **Presses scale and dim** rather than swapping background colour, and the
  grey iOS tap highlight is suppressed in favour of explicit states.
- Safe-area insets respected top and bottom; 44pt nav bar; 44px tap targets.

The Figma file remains a **1440px desktop landing page** — one frame, no mobile
screens — so its structure and copy were carried across and the layout designed
at 360–430px per PRD §10.2. Two things could not be read from it:

- **Typefaces.** The text nodes carry no font binding. The app now uses the
  system stack for the iOS feel; swap `fontFamily` if the brand needs a webfont.
- **Store address.** Figma’s footer says *Mankar*; the PRD says *Ausha,
  Nabastha, Memari — 713407*, and PRD Q1 flags 713401 vs 713407 as unresolved.
  The PRD address is used. Settle it before launch — it goes into Google Business.

### Performance (PRD §9.1)

| Budget | Target | Actual |
|---|---|---|
| N-1.2 initial JS | < 150 KB gzipped | **85 KB** (31 KB app + 54 KB vendor) |
| N-1.4 CLS | < 0.1 | every image has explicit width/height |
| N-1.6 | no layout blocked on 3rd-party script | analytics is a no-op stub |

Route-level code splitting keeps the landing entry small; admin is its own chunk.
N-3.1 (44px tap targets) is enforced in `index.css` rather than remembered
per-component. N-1.1 (LCP < 2.5s on a mid-tier Android over 4G) needs measuring
on a real device against real photography — it is not verifiable here.

---

## Open questions that block launch

PRD §15.3 Q1–Q12 are business decisions, not engineering ones. The ones that
change what this app computes are surfaced in `/admin/settings` and marked
`OWNER-CONFIRM` in `api/mock/settings.ts`:

- **Q1** Store PIN — 713401 or 713407?
- **Q2** Are displayed rates inclusive or exclusive of GST, and at what rate?
- **Q3** Exact delivery charges and free-delivery thresholds per zone
- **Q4/Q5** Breakage-in-transit and return policy — the copy currently on
  `/policies` is a plain-language draft, not the shop's position
- **Q6** Is a trade rate offered, and how is eligibility decided?
- **Q11** GSTIN for the footer

Until Q2 and Q3 are answered, the totals this app shows are structurally correct
but numerically provisional — which matters, because PRD R2 makes
estimate-to-bill variance the counter-metric the whole project is judged on.
