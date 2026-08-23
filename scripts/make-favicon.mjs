/**
 * Generates the favicon set from one shared geometry, so the SVG and the raster
 * files cannot drift apart. Run with `npm run favicon` after editing MARK below.
 *
 * The mark is a serif "T" knocked out of a rounded near-black tile — the site's
 * own --home-fg, and the highest contrast option at 16px, where a lighter or
 * outlined mark turns to mush. It is drawn from rectangles rather than set in
 * DM Serif Display so the same numbers can drive both the vector and the
 * rasteriser; a real font glyph would need a font parser and would still have
 * to be hand-hinted to survive 16px.
 *
 * Outputs (all into public/):
 *   favicon.svg          scalable, what modern browsers actually use
 *   favicon.ico          32 and 16px, for browsers that still ask for /favicon.ico
 *   apple-touch-icon.png 180px, iOS home screen
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const TILE = [10, 10, 10]; // #0a0a0a — matches --home-fg on the home screen
const GLYPH = [255, 255, 255];
const RADIUS = 0.22; // corner radius as a fraction of the tile

/** All coordinates are fractions of the tile, origin top-left. */
const MARK = {
  crossbar: { x0: 0.16, y0: 0.22, x1: 0.84, y1: 0.365 },
  stem: { x0: 0.425, y0: 0.22, x1: 0.575, y1: 0.78 },
  foot: { x0: 0.31, y0: 0.665, x1: 0.69, y1: 0.78 },
};

const inRect = (x, y, r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const inGlyph = (x, y) =>
  inRect(x, y, MARK.crossbar) || inRect(x, y, MARK.stem) || inRect(x, y, MARK.foot);

/** Rounded square covering the whole tile. */
function inTile(x, y) {
  const r = RADIUS;
  const cx = x < r ? r : x > 1 - r ? 1 - r : x;
  const cy = y < r ? r : y > 1 - r ? 1 - r : y;
  if (cx === x && cy === y) return true;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/**
 * Renders to RGBA. Sampled at 4x4 per pixel and averaged — the corners and the
 * stem edges alias badly at 16px without it.
 */
function render(size) {
  const SS = 4;
  const out = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let tile = 0;
      let glyph = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          if (!inTile(x, y)) continue;
          tile += 1;
          if (inGlyph(x, y)) glyph += 1;
        }
      }
      const total = SS * SS;
      const alpha = tile / total;
      const i = (py * size + px) * 4;
      if (alpha === 0) continue;
      // Glyph coverage is relative to the tile it sits on, not the whole pixel.
      const g = tile === 0 ? 0 : glyph / tile;
      for (let c = 0; c < 3; c++) {
        out[i + c] = Math.round(TILE[c] * (1 - g) + GLYPH[c] * g);
      }
      out[i + 3] = Math.round(alpha * 255);
    }
  }
  return out;
}

/* ---------- PNG ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function toPng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  // 10..12 stay 0: deflate, adaptive filtering, no interlace.

  // Every scanline is prefixed with its filter type; 0 means "none".
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- ICO ---------- */

/**
 * A BMP-format ICO entry: BITMAPINFOHEADER, then bottom-up BGRA pixels, then a
 * 1bpp AND mask. The mask is all zeros because the alpha channel already covers
 * transparency, but it has to be present and 4-byte aligned per row.
 */
function toIcoImage(rgba, size) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // image + mask, per the ICO spec
  header.writeUInt16LE(1, 12); // planes
  header.writeUInt16LE(32, 14); // bits per pixel

  const xor = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const src = (size - 1 - y) * size * 4; // BMP rows run bottom-up
    for (let x = 0; x < size; x++) {
      const s = src + x * 4;
      const d = (y * size + x) * 4;
      xor[d] = rgba[s + 2]; // B
      xor[d + 1] = rgba[s + 1]; // G
      xor[d + 2] = rgba[s]; // R
      xor[d + 3] = rgba[s + 3]; // A
    }
  }

  const maskRow = Math.ceil(size / 32) * 4;
  const mask = Buffer.alloc(maskRow * size);
  header.writeUInt32LE(xor.length + mask.length, 20);

  return Buffer.concat([header, xor, mask]);
}

function toIco(sizes) {
  const images = sizes.map((size) => toIcoImage(render(size), size));
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2); // 1 = icon
  dir.writeUInt16LE(sizes.length, 4);

  let offset = 6 + sizes.length * 16;
  const entries = sizes.map((size, i) => {
    const e = Buffer.alloc(16);
    e[0] = size === 256 ? 0 : size;
    e[1] = size === 256 ? 0 : size;
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(images[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += images[i].length;
    return e;
  });

  return Buffer.concat([dir, ...entries, ...images]);
}

/* ---------- SVG ---------- */

const pct = (n) => +(n * 100).toFixed(2);
const rect = (r) =>
  `<rect x="${pct(r.x0)}" y="${pct(r.y0)}" width="${pct(r.x1 - r.x0)}" height="${pct(
    r.y1 - r.y0,
  )}" fill="#ffffff"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Tei Chang">
  <rect width="100" height="100" rx="${pct(RADIUS)}" fill="rgb(${TILE.join(',')})"/>
  ${rect(MARK.crossbar)}
  ${rect(MARK.stem)}
  ${rect(MARK.foot)}
</svg>
`;

writeFileSync(join(PUBLIC_DIR, 'favicon.svg'), svg);
writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), toIco([32, 16]));
writeFileSync(join(PUBLIC_DIR, 'apple-touch-icon.png'), toPng(render(180), 180));

console.log('wrote favicon.svg, favicon.ico (32+16), apple-touch-icon.png');
