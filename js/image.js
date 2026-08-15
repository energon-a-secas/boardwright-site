// ── Reference renders ────────────────────────────────────────
// The images that ship in the bundle. They are spec sheets, not art:
// every zone and slot is labelled with the same id the JSON uses, so a
// reader can hold the picture and the model side by side.

import { zoneKind, fieldType } from './model.js';

const FONT = "600 %spx 'Avenir Next', -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "%spx ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/* ── Board ────────────────────────────────────────────────── */

/**
 * @param {object} d design
 * @param {number} [scale] px per board unit
 * @returns {HTMLCanvasElement}
 */
export function drawBoard(d, scale = 1) {
  const capH = 44;
  const w = Math.round(d.board.width * scale);
  const h = Math.round(d.board.height * scale);
  const cv = canvas(w, h + capH);
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#080c18';
  ctx.fillRect(0, 0, w, h + capH);

  // Grid: gives a reader a sense of scale without a ruler.
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  const step = 100 * scale;
  for (let x = step; x < w; x += step) line(ctx, x, 0, x, h);
  for (let y = step; y < h; y += step) line(ctx, 0, y, w, y);

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  d.board.zones.forEach((z) => drawZone(ctx, z, scale));

  // Caption strip: what this image is, in the image.
  ctx.fillStyle = '#0d1326';
  ctx.fillRect(0, h, w, capH);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = FONT.replace('%s', '16');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(d.meta.name || 'Untitled game', 16, h + capH / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = MONO.replace('%s', '13');
  ctx.textAlign = 'right';
  ctx.fillText(`${d.board.width}x${d.board.height} units · ${d.board.zones.length} zones`, w - 16, h + capH / 2);

  return cv;
}

function drawZone(ctx, z, scale) {
  const kind = zoneKind(z.kind);
  const x = z.x * scale;
  const y = z.y * scale;
  const w = z.w * scale;
  const h = z.h * scale;
  const r = Math.min(10 * scale, w / 2, h / 2);

  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = `hsl(${kind.hue} 70% 52% / 0.15)`;
  ctx.fill();
  ctx.strokeStyle = `hsl(${kind.hue} 72% 62% / 0.85)`;
  ctx.lineWidth = Math.max(1.5 * scale, 1.5);
  ctx.stroke();

  const pad = 12 * scale;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#ffffff';
  ctx.font = FONT.replace('%s', String(Math.max(15 * scale, 11)));
  clipText(ctx, z.name, x + pad, y + pad, w - pad * 2);

  const bits = [kind.label, ownerWord(z.owner)];
  if (z.visibility !== 'public') bits.push(z.visibility === 'hidden' ? 'hidden' : 'owner only');
  if (z.capacity) bits.push(`max ${z.capacity}`);
  ctx.fillStyle = `hsl(${kind.hue} 60% 78% / 0.9)`;
  ctx.font = FONT.replace('%s', String(Math.max(12 * scale, 9)));
  clipText(ctx, bits.join(' · '), x + pad, y + pad + Math.max(19 * scale, 14), w - pad * 2);

  // The id is what the JSON and the brief refer to — printing it here is
  // what lets someone match this rectangle to that row.
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = MONO.replace('%s', String(Math.max(11 * scale, 8)));
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  clipText(ctx, z.id, x + w - pad, y + h - pad * 0.6, w - pad * 2, true);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

const ownerWord = (o) => (o === 'shared' ? 'shared' : o === 'per-player' ? 'per player' : 'active player');

/* ── Cards ────────────────────────────────────────────────── */

/**
 * @param {object} tpl template
 * @param {number} [pxPerMm]
 * @returns {HTMLCanvasElement}
 */
export function drawCard(tpl, pxPerMm = 10) {
  const w = Math.round(tpl.w * pxPerMm);
  const h = Math.round(tpl.h * pxPerMm);
  const cv = canvas(w, h);
  const ctx = cv.getContext('2d');

  const r = tpl.corner * pxPerMm;
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0, 0, w, h);
  roundRect(ctx, 1, 1, w - 2, h - 2, r);
  ctx.fillStyle = '#f5f2ea';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,24,40,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  tpl.fields.forEach((f) => drawSlot(ctx, f, w, h));
  return cv;
}

function drawSlot(ctx, f, cw, ch) {
  const x = (f.x / 100) * cw;
  const y = (f.y / 100) * ch;
  const w = (f.w / 100) * cw;
  const h = (f.h / 100) * ch;
  const art = f.type === 'art' || f.type === 'icon';

  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = art ? 'rgba(30,40,70,0.5)' : 'rgba(30,40,70,0.32)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  if (art) {
    ctx.strokeStyle = 'rgba(30,40,70,0.22)';
    line(ctx, x, y, x + w, y + h);
    line(ctx, x + w, y, x, y + h);
  }

  // Slot label, small and out of the way of the sample content.
  ctx.fillStyle = 'rgba(40,52,88,0.62)';
  ctx.font = MONO.replace('%s', String(Math.max(Math.round(ch * 0.014), 8)));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(f.label.toUpperCase(), x + 3, y + 2);

  const sample = f.sample || (art ? '' : fieldType(f.type).sample);
  if (sample) {
    const size = { sm: 0.026, md: 0.038, lg: 0.056 }[f.size] || 0.038;
    ctx.fillStyle = '#141a2c';
    ctx.font = FONT.replace('%s', String(Math.round(ch * size)));
    ctx.textAlign = f.align === 'center' ? 'center' : f.align === 'right' ? 'right' : 'left';
    const tx = f.align === 'center' ? x + w / 2 : f.align === 'right' ? x + w - 4 : x + 4;
    wrapText(ctx, sample, tx, y + h * 0.32, w - 8, ctx.measureText('M').width * 1.5);
  }
  ctx.restore();
}

/* ── Canvas helpers ───────────────────────────────────────── */

function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(w, 1);
  cv.height = Math.max(h, 1);
  return cv;
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, rad);
    return;
  }
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Draw text, truncating with an ellipsis rather than spilling past `max`. */
function clipText(ctx, text, x, y, max, rightAligned = false) {
  let str = String(text);
  if (ctx.measureText(str).width <= max) {
    ctx.fillText(str, x, y);
    return;
  }
  while (str.length > 1 && ctx.measureText(`${str}…`).width > max) str = str.slice(0, -1);
  ctx.fillText(`${str}…`, x, y);
  void rightAligned;
}

function wrapText(ctx, text, x, y, max, lineHeight) {
  const words = String(text).split(/\s+/);
  let line0 = '';
  let ty = y;
  words.forEach((word) => {
    const test = line0 ? `${line0} ${word}` : word;
    if (ctx.measureText(test).width > max && line0) {
      ctx.fillText(line0, x, ty);
      line0 = word;
      ty += lineHeight;
    } else {
      line0 = test;
    }
  });
  if (line0) ctx.fillText(line0, x, ty);
}

/** @returns {Promise<Blob>} */
export function toBlob(cv) {
  return new Promise((resolve) => cv.toBlob((b) => resolve(b), 'image/png'));
}
