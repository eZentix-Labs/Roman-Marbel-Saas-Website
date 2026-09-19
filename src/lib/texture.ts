import type { Material, ProductImage } from '@/types';

/**
 * Stand-in for the Cloudinary/ImageKit pipeline in TRD §7.
 *
 * Production replaces this file wholesale: `imageUrl()` becomes a CDN
 * transformation URL builder and the SVG generation disappears. Everything
 * above this module already calls it with a context ("thumb" | "hero" | "zoom" |
 * "og"), which maps 1:1 onto the transformation table in TRD §7.2 — so the
 * swap is a one-file change, not a component rewrite.
 *
 * Until the photography day in PRD Phase 0 happens, these deterministic SVG
 * textures give the grid real visual variety. They are obviously not
 * photographs, and no estimate or rate depends on them.
 */

export type ImageContext = 'thumb' | 'hero' | 'zoom' | 'og';

/** TRD §7.2 — the only four sizes a customer is ever served. */
export const TRANSFORMS: Record<ImageContext, { w: number; h: number; maxKb: number }> = {
  thumb: { w: 400, h: 500, maxKb: 40 },
  hero: { w: 800, h: 1000, maxKb: 180 },
  zoom: { w: 1600, h: 1600, maxKb: 400 },
  og: { w: 1200, h: 630, maxKb: 200 },
};

/** Deterministic PRNG so a given seed always renders the same slab. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amt);
  const g = clamp(((n >> 8) & 255) + amt);
  const b = clamp((n & 255) + amt);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/**
 * Veins run along a shared diagonal with per-vein wander. Real marble veining
 * has a direction — it came off a saw in one orientation. Fully random control
 * points read as pen scribble, which is exactly what they looked like before.
 */
function veins(
  rand: () => number,
  colour: string,
  count: number,
  opts: { width: number; opacity: number; blur: string },
): string {
  // One flow direction per slab, roughly diagonal.
  const angle = (rand() * 0.7 + 0.25) * Math.PI;
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let out = '<g filter="url(#' + opts.blur + ')">';

  for (let i = 0; i < count; i++) {
    // Start off-canvas on one side so no vein visibly begins mid-slab.
    const off = (i / count) * 150 - 25 + rand() * 18;
    const sx = 50 - dx * 90 + -dy * off;
    const sy = 50 - dy * 90 + dx * off;

    let d = 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1);
    let px = sx, py = sy;
    const segs = 4;
    for (let s = 0; s < segs; s++) {
      const len = 180 / segs;
      // Wander perpendicular to the flow, never against it.
      const wob = (rand() - 0.5) * 26;
      const nx = px + dx * len + -dy * wob;
      const ny = py + dy * len + dx * wob;
      const cx = px + dx * len * 0.5 + -dy * wob * 1.4;
      const cy = py + dy * len * 0.5 + dx * wob * 1.4;
      d += ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + nx.toFixed(1) + ' ' + ny.toFixed(1);
      px = nx; py = ny;
    }

    const w = (opts.width * (0.35 + rand() * 1.3)).toFixed(2);
    const o = (opts.opacity * (0.55 + rand() * 0.6)).toFixed(2);
    out += '<path d="' + d + '" stroke="' + colour + '" stroke-width="' + w +
      '" fill="none" stroke-linecap="round" opacity="' + o + '"/>';
  }
  return out + '</g>';
}

/**
 * Grain, not confetti. Radii stay well under 1 unit in a 100-unit viewBox so
 * that at a 400px render each grain is roughly a pixel, which is what crystal
 * flecks in granite actually look like.
 */
function speckle(
  rand: () => number,
  colours: string[],
  count: number,
  maxR = 0.55,
): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    const cx = (rand() * 100).toFixed(1);
    const cy = (rand() * 100).toFixed(1);
    const r = (0.12 + rand() * maxR).toFixed(2);
    const c = colours[Math.floor(rand() * colours.length)];
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + c + '" opacity="' +
      (0.3 + rand() * 0.55).toFixed(2) + '"/>';
  }
  return out;
}

/** Soft tonal clouding — what makes a plain surface look like material. */
function clouds(rand: () => number, colours: string[], count: number): string {
  let out = '<g filter="url(#blurL)">';
  for (let i = 0; i < count; i++) {
    const cx = (rand() * 110 - 5).toFixed(1);
    const cy = (rand() * 110 - 5).toFixed(1);
    const rx = (12 + rand() * 30).toFixed(1);
    const ry = (8 + rand() * 24).toFixed(1);
    const c = colours[Math.floor(rand() * colours.length)];
    out += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + c + '" opacity="' + (0.05 + rand() * 0.11).toFixed(2) + '"/>';
  }
  return out + '</g>';
}

function woodGrain(rand: () => number, base: string): string {
  let out = '';
  for (let i = 0; i < 26; i++) {
    const y = (i * 4 + rand() * 2).toFixed(1);
    const w = (0.3 + rand() * 1.1).toFixed(2);
    out += '<path d="M0 ' + y + ' Q50 ' + (parseFloat(y) + rand() * 3 - 1.5).toFixed(1) +
      ' 100 ' + (parseFloat(y) + rand() * 2 - 1).toFixed(1) +
      '" stroke="' + shade(base, -22) + '" stroke-width="' + w +
      '" fill="none" opacity="' + (0.15 + rand() * 0.3).toFixed(2) + '"/>';
  }
  return out;
}

/** Perceived lightness, 0–255. Drives how hard the pattern has to push. */
function luma(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

/**
 * The surface pattern, without tile grout lines.
 *
 * Contrast is scaled against the base colour's lightness rather than fixed:
 * a -30 shift that reads clearly on mid grey is invisible on a near-white
 * marble, and a near-white marble that renders as a blank rectangle defeats the
 * point of a photo-first catalogue.
 */
function surface(material: Material, hex: string, seed: string): string {
  const rand = rng(seed);
  const L = luma(hex);
  // Light materials get a deeper cut; dark ones get lifted instead.
  const deep = L > 190 ? -78 : L > 140 ? -62 : -46;
  const lift = L < 70 ? 62 : L < 120 ? 44 : 30;
  const light = shade(hex, lift);
  const dark = shade(hex, deep);
  const base =
    '<rect width="100" height="100" fill="' + hex + '"/>' +
    '<rect width="100" height="100" fill="url(#g)"/>';

  switch (material) {
    case 'marble':
      // Clouded ground, a few strong veins, finer tributaries alongside them.
      return base +
        clouds(rand, [dark, light], 5) +
        veins(rand, dark, 3, { width: 1.6, opacity: 0.72, blur: 'blurS' }) +
        veins(rand, shade(hex, deep + 30), 8, { width: 0.55, opacity: 0.55, blur: 'blurS' }) +
        veins(rand, light, 3, { width: 1.1, opacity: 0.45, blur: 'blurM' });
    case 'granite':
      // Dense crystal grain over a lightly mottled ground.
      return base +
        clouds(rand, [dark], 3) +
        speckle(rand, [dark, shade(hex, deep + 34)], 900, 0.5) +
        speckle(rand, [light, shade(hex, lift + 24)], 520, 0.42);
    case 'vitrified':
      // Engineered surface: mostly smooth, soft clouding, restrained veining.
      return base +
        clouds(rand, [light, dark], 4) +
        veins(rand, shade(hex, deep + 24), 4, { width: 0.9, opacity: 0.44, blur: 'blurM' }) +
        veins(rand, light, 2, { width: 1.3, opacity: 0.40, blur: 'blurM' });
    case 'ceramic':
      // Matt body with fine grain and a hint of mottling.
      return base +
        clouds(rand, [dark, light], 4) +
        speckle(rand, [dark, light], 700, 0.38);
    default:
      return base + woodGrain(rand, hex);
  }
}

/**
 * Builds the three shot types PRD F-1.3 requires. The admin upload flow enforces
 * the same three slots (TRD §7.4), so an incomplete product is visibly
 * incomplete before publish.
 *   flat    — close-up of the surface
 *   context — the same surface laid as a floor, in perspective, with a skirting line
 *   scale   — an edge-on shot with a thickness callout
 */
export function textureSvg(
  material: Material,
  hex: string,
  seed: string,
  type: ProductImage['type'],
  sizeMm: string,
): string {
  const L = luma(hex);
  const light = shade(hex, L < 90 ? 54 : 26);
  const dark = shade(hex, L > 190 ? -70 : -44);
  const grout = shade(hex, L > 190 ? -92 : -62);
  const inner = surface(material, hex, seed);

  const defs =
    '<defs>' +
    // Blur is what separates raised from pen-line. Kept as three fixed strengths
    // so the same vein geometry can read as a hard seam or a soft cloud.
    '<filter id="blurS" x="-20%" y="-20%" width="140%" height="140%">' +
    '<feGaussianBlur stdDeviation="0.5"/></filter>' +
    '<filter id="blurM" x="-20%" y="-20%" width="140%" height="140%">' +
    '<feGaussianBlur stdDeviation="1.4"/></filter>' +
    '<filter id="blurL" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feGaussianBlur stdDeviation="6"/></filter>' +
    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="' + light + '" stop-opacity="0.7"/>' +
    '<stop offset="52%" stop-color="' + hex + '" stop-opacity="0"/>' +
    '<stop offset="100%" stop-color="' + dark + '" stop-opacity="0.55"/>' +
    '</linearGradient>' +
    '<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.30"/>' +
    '<stop offset="40%" stop-color="#ffffff" stop-opacity="0.02"/>' +
    '<stop offset="100%" stop-color="#000000" stop-opacity="0.12"/>' +
    '</linearGradient>' +
    '<pattern id="tile" width="50" height="50" patternUnits="userSpaceOnUse">' +
    '<g>' + inner.replace(/width="100" height="100"/g, 'width="50" height="50"') + '</g>' +
    '<rect width="50" height="50" fill="none" stroke="' + grout + '" stroke-width="0.9" opacity="0.5"/>' +
    '</pattern>' +
    '</defs>';

  if (type === 'context') {
    // Floor laid in perspective, wall above, skirting band between.
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">' +
      defs +
      '<rect width="100" height="46" fill="#efe7db"/>' +
      '<rect y="0" width="100" height="46" fill="url(#sheen)" opacity="0.5"/>' +
      '<rect y="42" width="100" height="4" fill="' + dark + '" opacity="0.85"/>' +
      '<g transform="translate(50,46) scale(1,0.52) rotate(0) translate(-50,-46)">' +
      '<rect y="46" width="100" height="120" fill="url(#tile)"/>' +
      '</g>' +
      '<rect y="46" width="100" height="54" fill="url(#sheen)" opacity="0.55"/>' +
      '<ellipse cx="72" cy="58" rx="26" ry="7" fill="#ffffff" opacity="0.10"/>' +
      '</svg>'
    );
  }

  if (type === 'scale') {
    // Edge-on, showing thickness against a reference band.
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">' +
      defs +
      '<rect width="100" height="100" fill="#efe7db"/>' +
      '<g transform="translate(6,26)">' +
      '<rect width="88" height="44" rx="1">' + '</rect>' +
      '<g>' + inner.replace(/width="100" height="100"/g, 'width="88" height="44"') + '</g>' +
      '<rect width="88" height="44" fill="url(#sheen)"/>' +
      '<rect y="44" width="88" height="7" fill="' + dark + '"/>' +
      '<rect y="44" width="88" height="7" fill="#000" opacity="0.18"/>' +
      '</g>' +
      '<rect x="6" y="84" width="88" height="1" fill="#231f1c" opacity="0.35"/>' +
      '<text x="50" y="94" font-family="Inter,sans-serif" font-size="6" fill="#231f1c" ' +
      'text-anchor="middle" opacity="0.65">' + sizeMm + ' mm</text>' +
      '</svg>'
    );
  }

  // flat — full-bleed close-up of the material
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">' +
    defs + inner + '<rect width="100" height="100" fill="url(#sheen)"/>' +
    '</svg>'
  );
}

const cache = new Map<string, string>();

/**
 * The single entry point every component uses. Swap the body for a CDN URL
 * builder in production; the signature does not change.
 */
export function imageUrl(
  opts: {
    seed: string;
    material: Material;
    hex: string;
    type?: ProductImage['type'];
    sizeMm?: string;
  },
  _context: ImageContext = 'thumb',
): string {
  const type = opts.type ?? 'flat';
  const key = opts.seed + '|' + type + '|' + opts.hex + '|' + opts.material;
  const hit = cache.get(key);
  if (hit) return hit;
  const svg = textureSvg(opts.material, opts.hex, opts.seed, type, opts.sizeMm ?? '600x600');
  const url = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  cache.set(key, url);
  return url;
}
