// ── Glyph set ────────────────────────────────────────────────
// Original artwork, drawn here rather than imported. The icon sets
// people usually reach for (Noun Project and friends) are licensed
// CC-BY or per-seat, and a design tool that bakes them into an export
// hands its users someone else's attribution problem. These are ours,
// so anything Boardwright exports is the designer's to print and sell.
//
// One source, two renderers: the same path data goes to inline SVG in
// the editor and to Path2D on the export canvas. Stroked rather than
// filled, on a 24x24 grid, because stroked shapes stay legible when a
// card is printed at 30mm and scale without a second weight.

export const ICON_SIZE = 24;
export const ICON_STROKE = 2.4;

/**
 * @typedef {object} Glyph
 * @property {string} id
 * @property {string} label
 * @property {string} group
 * @property {string} d      path data on a 24x24 grid
 */

/** @type {Glyph[]} */
export const ICONS = [
  // ── Elements ──
  { id: 'fire', label: 'Fire', group: 'Elements', d: 'M12 3c2.6 3.4 4.6 5.8 4.6 8.6a4.6 4.6 0 1 1-9.2 0c0-1.2.5-2.3 1.3-3.2M12 20a2.4 2.4 0 0 0 2.4-2.4c0-1.4-1-2.3-2.4-4-1.4 1.7-2.4 2.6-2.4 4A2.4 2.4 0 0 0 12 20z' },
  { id: 'water', label: 'Water', group: 'Elements', d: 'M12 3.5c3.3 4.2 5.4 7 5.4 9.6a5.4 5.4 0 1 1-10.8 0c0-2.6 2.1-5.4 5.4-9.6zM9.6 13.6a2.6 2.6 0 0 0 2.6 2.6' },
  { id: 'wind', label: 'Wind', group: 'Elements', d: 'M3 8.5h8.5a2.6 2.6 0 1 0-2.6-2.6M3 12.5h11.5a2.8 2.8 0 1 1-2.8 2.8M3 16.5h6a2.2 2.2 0 1 1-2.2 2.2' },
  { id: 'earth', label: 'Earth', group: 'Elements', d: 'M2.5 19.5l6.2-9.6 3.6 5.5 2.6-3.8 6.6 7.9zM9 6.5a2 2 0 1 0 0-.1' },
  { id: 'leaf', label: 'Leaf', group: 'Elements', d: 'M20.5 3.5C10.5 4.4 4.5 9.5 4.5 16.4c0 1.6.4 2.8.4 2.8M5 19.2C6.6 12.6 11.6 7.6 20.5 3.5' },

  // ── Combat ──
  { id: 'fist', label: 'Fist', group: 'Combat', d: 'M6.5 10.5V8a1.8 1.8 0 0 1 3.6 0v1.6M10.1 9.6V7.2a1.8 1.8 0 0 1 3.6 0v2.4M13.7 9.8V8.4a1.8 1.8 0 0 1 3.6 0v5.4a6.2 6.2 0 0 1-6.2 6.2H10a5 5 0 0 1-5-5v-3.2a1.7 1.7 0 0 1 3.4 0' },
  { id: 'sword', label: 'Sword', group: 'Combat', d: 'M20.5 3.5l-.6 4.4-8.6 8.6-3.8-3.8 8.6-8.6zM8.4 13.9l-2.6 2.6 2.1 2.1 2.6-2.6M4.5 17.8l1.7 1.7' },
  { id: 'sword-up', label: 'Sword up', group: 'Combat', d: 'M14.5 3.5l5 .5.5 5-7.5 7.5-5.5-5.5zM7.3 12.7l-2.4 2.4 2 2 2.4-2.4M17 20.5v-6M14 17.5l3-3 3 3' },
  { id: 'swords', label: 'Crossed', group: 'Combat', d: 'M3.5 3.5l4 .4L18 14.4l-3.6 3.6L4 7.5zM20.5 3.5l-4 .4L6 14.4l3.6 3.6L20 7.5' },
  { id: 'axe', label: 'Axe', group: 'Combat', d: 'M13.5 4c3.5-1.6 6.4-.4 7.5 2.2-2.4 2.6-5.4 3-8 1.4M12.6 7.4L4 19.5M3 18.4l2.2 2.2' },
  { id: 'shield', label: 'Shield', group: 'Combat', d: 'M12 3l7.5 2.6v6c0 4.2-3.1 8-7.5 9.4C7.6 19.6 4.5 15.8 4.5 11.6v-6z' },
  { id: 'bow', label: 'Bow', group: 'Combat', d: 'M5 3.5a13 13 0 0 1 0 17M5 3.5l14 8.5L5 20.5M11 12h9M17 9l3 3-3 3' },

  // ── Magic ──
  { id: 'spark', label: 'Magic', group: 'Magic', d: 'M12 2.5l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z' },
  { id: 'ice', label: 'Ice', group: 'Magic', d: 'M12 2.5v19M4 7l16 10M20 7L4 17M12 6.5l-2.5-2M12 6.5l2.5-2M12 17.5l-2.5 2M12 17.5l2.5 2' },
  { id: 'bolt', label: 'Bolt', group: 'Magic', d: 'M13.5 2.5L5 13.5h6l-2.5 8L18 10.5h-6z' },
  { id: 'barrier', label: 'Barrier', group: 'Magic', d: 'M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z' },
  { id: 'skull', label: 'Skull', group: 'Magic', d: 'M12 2.8c4.5 0 7.6 3.2 7.6 7.4 0 2.6-1.2 4-2.4 5v3.4H8.8v-3.4c-1.2-1-2.4-2.4-2.4-5C6.4 6 9.5 2.8 12 2.8zM9.4 10.6a1.7 1.7 0 1 0 0-.1M14.6 10.6a1.7 1.7 0 1 0 0-.1' },
  { id: 'quake', label: 'Quake', group: 'Magic', d: 'M2.5 12.5h4l2.5-6 3 12 3-9 2 3h4.5' },

  // ── Items ──
  { id: 'book', label: 'Book', group: 'Items', d: 'M4 4.5h6a3 3 0 0 1 2 .9 3 3 0 0 1 2-.9h6v13h-6a3 3 0 0 0-2 .9 3 3 0 0 0-2-.9H4zM12 5.4v13' },
  { id: 'bag', label: 'Bag', group: 'Items', d: 'M6.5 8.5h11l1.5 11H5zM9 8.5V6.2a3 3 0 0 1 6 0v2.3' },
  { id: 'coin', label: 'Coin', group: 'Items', d: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v10M14.6 9.2a3 3 0 0 0-5.2 2c0 2.8 5.2 1.6 5.2 4.2a3 3 0 0 1-5.2 1.4' },
  { id: 'chest', label: 'Chest', group: 'Items', d: 'M3.5 10.5h17v9h-17zM3.5 10.5a8.5 4 0 0 1 17 0M12 8.5v13M9.5 13.5h5' },
  { id: 'scroll', label: 'Scroll', group: 'Items', d: 'M6 3.5h12v13a4 4 0 0 1-4 4H6a3 3 0 0 0 3-3v-11a3 3 0 0 0-3-3zM9 7.5h6M9 11h6' },
  { id: 'potion', label: 'Potion', group: 'Items', d: 'M9.5 2.5h5M10.5 2.5v5.2l-3.6 6.6a4.4 4.4 0 0 0 3.9 6.5h2.4a4.4 4.4 0 0 0 3.9-6.5l-3.6-6.6V2.5M7.6 14.5h8.8' },
  { id: 'gem', label: 'Gem', group: 'Items', d: 'M7 3.5h10l4 5.5-9 11.5L3 9zM3 9h18M7 3.5L12 20.5 17 3.5' },

  // ── Classes ──
  { id: 'hat', label: 'Wizard hat', group: 'Classes', d: 'M12 2.5l5 12.5H7zM4.5 15h15l1 4.5c-5.5 1.5-11.5 1.5-17 0z' },
  { id: 'helm', label: 'Helm', group: 'Classes', d: 'M5 10a7 7 0 0 1 14 0v6.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM5 12.5h5v3H5zM14 12.5h5v3h-5zM12 9v11.5' },
  { id: 'wolf', label: 'Beast', group: 'Classes', d: 'M4 4.5l3.5 3.5h9L20 4.5l.5 6.5c0 5-3.8 9-8.5 9s-8.5-4-8.5-9zM9 11.5a1.4 1.4 0 1 0 0-.1M15 11.5a1.4 1.4 0 1 0 0-.1M12 14.5v2M10 17.5h4' },

  // ── Markers ──
  { id: 'heart', label: 'Life', group: 'Markers', d: 'M12 20.5C6 16.4 3 13.2 3 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 9 2.6c0 3.6-3 6.8-9 10.9z' },
  { id: 'star', label: 'Star', group: 'Markers', d: 'M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.7l6.6-.9z' },
  { id: 'plus', label: 'Level up', group: 'Markers', d: 'M12 4v16M4 12h16' },
  { id: 'dice', label: 'Dice', group: 'Markers', d: 'M4.5 4.5h15v15h-15zM9 9a.6.6 0 1 0 0-.1M15 9a.6.6 0 1 0 0-.1M12 12a.6.6 0 1 0 0-.1M9 15a.6.6 0 1 0 0-.1M15 15a.6.6 0 1 0 0-.1' },
  { id: 'crown', label: 'Boss', group: 'Markers', d: 'M3 7l3.5 4 5.5-7 5.5 7L21 7l-2 12H5zM5 15.5h14' },
];

export const ICON_GROUPS = [...new Set(ICONS.map((i) => i.group))];
export const iconById = (id) => ICONS.find((i) => i.id === id) || null;

/** Inline SVG for the editor. */
export function iconSvg(id, cls = '') {
  const g = iconById(id);
  if (!g) return '';
  return `<svg class="${cls}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}" fill="none" stroke="currentColor"`
    + ` stroke-width="${ICON_STROKE}" stroke-linecap="round" stroke-linejoin="round"`
    + ` aria-hidden="true"><path d="${g.d}"/></svg>`;
}

/**
 * Draw a glyph centred in a box, scaled to fit with the stroke inset so a
 * round cap never clips at the edge.
 */
export function drawIcon(ctx, id, x, y, w, h, color) {
  const g = iconById(id);
  if (!g) return;
  const scale = Math.min(w, h) / ICON_SIZE;
  if (!(scale > 0)) return;

  ctx.save();
  ctx.translate(x + (w - ICON_SIZE * scale) / 2, y + (h - ICON_SIZE * scale) / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = ICON_STROKE;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(g.d));
  ctx.restore();
}
