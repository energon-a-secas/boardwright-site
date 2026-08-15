// ── Rect drag + resize ───────────────────────────────────────
// One pointer engine, two stages: board zones (units) and card slots
// (percent of the face). The caller supplies the coordinate space, so
// this file never learns what a zone or a slot is.

const DIRS = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

/**
 * @typedef {object} RectCtl
 * @property {() => {x:number,y:number,w:number,h:number}} getRect
 * @property {(r: object, final: boolean) => void} setRect
 * @property {() => number} scale     px per coordinate unit (x axis)
 * @property {() => number} [scaleY]  px per unit on y, when it differs
 * @property {() => {w:number,h:number}} bounds
 * @property {() => number} snap      step in units, 0 to disable
 * @property {{w:number,h:number}} min
 * @property {() => void} [onStart]
 * @property {() => void} [onSelect]
 */

/**
 * Make an absolutely-positioned element draggable and resizable.
 * @param {HTMLElement} node
 * @param {RectCtl} ctl
 */
export function attachRect(node, ctl) {
  node.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const handle = /** @type {HTMLElement} */ (e.target).closest('[data-dir]');
    // A click on a control inside the rect (rename, delete) is not a drag.
    if (!handle && /** @type {HTMLElement} */ (e.target).closest('button, input, select, textarea')) return;

    e.preventDefault();
    e.stopPropagation();
    ctl.onSelect?.();

    const dir = handle ? handle.dataset.dir : 'move';
    const start = { ...ctl.getRect() };
    const px0 = { x: e.clientX, y: e.clientY };
    let moved = false;

    const onMove = (ev) => {
      // Card slots live in percent, where a percent of width and a percent
      // of height are different pixel counts — hence a scale per axis.
      const sx = ctl.scale() || 1;
      const sy = (ctl.scaleY ? ctl.scaleY() : sx) || 1;
      const dx = (ev.clientX - px0.x) / sx;
      const dy = (ev.clientY - px0.y) / sy;
      if (!moved && Math.abs(ev.clientX - px0.x) + Math.abs(ev.clientY - px0.y) < 2) return;
      if (!moved) {
        moved = true;
        ctl.onStart?.();
      }
      ctl.setRect(applyDelta(dir, start, dx, dy, ctl), false);
    };

    const onUp = () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointercancel', onUp);
      if (moved) ctl.setRect(ctl.getRect(), true);
    };

    node.setPointerCapture(e.pointerId);
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerup', onUp);
    node.addEventListener('pointercancel', onUp);
  });
}

function applyDelta(dir, start, dx, dy, ctl) {
  const step = ctl.snap() || 0;
  const b = ctl.bounds();
  const min = ctl.min;
  const r = { ...start };

  if (dir === 'move') {
    r.x = snapTo(start.x + dx, step);
    r.y = snapTo(start.y + dy, step);
    r.x = clamp(r.x, 0, b.w - r.w);
    r.y = clamp(r.y, 0, b.h - r.h);
    return r;
  }

  if (dir.includes('e')) r.w = snapTo(start.w + dx, step);
  if (dir.includes('s')) r.h = snapTo(start.h + dy, step);
  if (dir.includes('w')) {
    const right = start.x + start.w;
    r.x = snapTo(start.x + dx, step);
    r.w = right - r.x;
  }
  if (dir.includes('n')) {
    const bottom = start.y + start.h;
    r.y = snapTo(start.y + dy, step);
    r.h = bottom - r.y;
  }

  // Clamp width/height first, then pull the moving edge back so a rect
  // squeezed past its minimum stops rather than flipping inside out.
  if (r.w < min.w) {
    if (dir.includes('w')) r.x = start.x + start.w - min.w;
    r.w = min.w;
  }
  if (r.h < min.h) {
    if (dir.includes('n')) r.y = start.y + start.h - min.h;
    r.h = min.h;
  }
  if (r.x < 0) { r.w += r.x; r.x = 0; }
  if (r.y < 0) { r.h += r.y; r.y = 0; }
  if (r.x + r.w > b.w) r.w = b.w - r.x;
  if (r.y + r.h > b.h) r.h = b.h - r.y;

  return r;
}

const snapTo = (v, step) => (step > 0 ? Math.round(v / step) * step : Math.round(v * 100) / 100);
export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/** Append the eight resize grips. */
export function addHandles(node) {
  DIRS.forEach((dir) => {
    const h = document.createElement('span');
    h.className = `grip grip--${dir}`;
    h.dataset.dir = dir;
    node.appendChild(h);
  });
}
