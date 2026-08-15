// ── Board view ───────────────────────────────────────────────
// Free-form zones on a scaled stage. Zones are stored in board units;
// the stage renders them in pixels at whatever scale fits the pane.

import { ZONE_KINDS, OWNERS, VISIBILITY, newZone, zoneKind, uid } from './model.js';
import { state, commit, zones, zoneById, historyGate, emit } from './state.js';
import { buildForm, el } from './forms.js';
import { attachRect, addHandles, clamp } from './drag.js';
import { $ } from './utils.js';

const SNAP_STEP = 10;
const MIN = { w: 60, h: 40 };

let scale = 1;

const board = () => state.design.board;
const stageEl = () => $('boardStage');

/** px per board unit, chosen so the whole board fits the pane. */
function fit() {
  const wrap = stageEl()?.parentElement;
  if (!wrap) return 1;
  const pad = 32;
  const availW = Math.max(wrap.clientWidth - pad, 200);
  const availH = Math.max(wrap.clientHeight - pad, 200);
  // Floor the scale rather than shrink to fit at any cost: in a short pane a
  // fitted board goes past legibility, and the stage can scroll instead.
  return clamp(Math.min(availW / board().width, availH / board().height), 0.3, 1.2);
}

export function renderBoard() {
  const stage = stageEl();
  if (!stage) return;
  scale = fit();
  stage.style.width = `${board().width * scale}px`;
  stage.style.height = `${board().height * scale}px`;
  stage.style.setProperty('--grid', `${SNAP_STEP * 5 * scale}px`);

  stage.textContent = '';
  zones().forEach((z) => stage.appendChild(zoneNode(z)));

  $('boardW').value = board().width;
  $('boardH').value = board().height;
  $('snapToggle').checked = state.snap;
  $('undoBtn').disabled = state.history.length === 0;

  renderKindGrid();
  renderZoneList();
  renderInspector();
}

function zoneNode(z) {
  const kind = zoneKind(z.kind);
  const node = el('div', 'zone');
  node.dataset.id = z.id;
  node.style.setProperty('--hue', kind.hue);
  if (z.id === state.selectedZone) node.classList.add('is-selected');
  // Below ~46px the metadata line would be clipped rather than read.
  const px = z.h * scale;
  if (px < 46) node.classList.add('zone--short');
  if (px < 26) node.classList.add('zone--tiny');
  place(node, z);

  node.appendChild(el('span', 'zone-name', z.name));
  const meta = el('span', 'zone-meta');
  meta.append(
    el('span', 'zone-tag', kind.label),
    el('span', 'zone-dot', z.owner === 'shared' ? 'shared' : z.owner === 'per-player' ? 'per player' : 'active'),
  );
  if (z.visibility !== 'public') meta.appendChild(el('span', 'zone-dot', z.visibility === 'hidden' ? 'hidden' : 'owner only'));
  if (z.capacity) meta.appendChild(el('span', 'zone-dot', `max ${z.capacity}`));
  node.appendChild(meta);
  addHandles(node);

  attachRect(node, {
    getRect: () => ({ x: z.x, y: z.y, w: z.w, h: z.h }),
    setRect: (r, final) => {
      commit((d) => {
        const live = d.board.zones.find((v) => v.id === z.id);
        if (live) Object.assign(live, round(r));
      }, { history: false, silent: !final });
      Object.assign(z, round(r));
      place(node, z);
      if (final) emit();
    },
    scale: () => scale,
    bounds: () => ({ w: board().width, h: board().height }),
    snap: () => (state.snap ? SNAP_STEP : 0),
    min: MIN,
    onStart: () => { commit(() => {}, { silent: true }); },
    onSelect: () => select(z.id),
  });

  return node;
}

const round = (r) => ({
  x: Math.round(r.x), y: Math.round(r.y),
  w: Math.round(r.w), h: Math.round(r.h),
});

function place(node, z) {
  node.style.left = `${z.x * scale}px`;
  node.style.top = `${z.y * scale}px`;
  node.style.width = `${z.w * scale}px`;
  node.style.height = `${z.h * scale}px`;
}

function renderKindGrid() {
  const grid = $('zoneKindGrid');
  grid.textContent = '';
  ZONE_KINDS.forEach((k) => {
    const btn = el('button', 'kind-btn');
    btn.type = 'button';
    btn.title = k.hint;
    btn.style.setProperty('--hue', k.hue);
    btn.append(el('span', 'kind-swatch'), el('span', 'kind-label', k.label));
    btn.addEventListener('click', () => addZone(k.id));
    grid.appendChild(btn);
  });
}

function renderZoneList() {
  const list = $('zoneList');
  list.textContent = '';
  $('zoneCount').textContent = String(zones().length);
  if (!zones().length) {
    const empty = el('li', 'rail-empty', 'No zones yet. Pick a kind above to place the first one.');
    list.appendChild(empty);
    return;
  }
  zones().forEach((z) => {
    const li = el('li', 'rail-item');
    if (z.id === state.selectedZone) li.classList.add('is-on');
    li.style.setProperty('--hue', zoneKind(z.kind).hue);
    const btn = el('button', 'rail-item-btn');
    btn.type = 'button';
    btn.append(el('span', 'rail-swatch'), el('span', 'rail-item-name', z.name));
    btn.addEventListener('click', () => { select(z.id); emit(); });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderInspector() {
  const box = $('boardInspector');
  box.textContent = '';
  const z = zoneById(state.selectedZone);

  if (!z) {
    box.appendChild(el('h2', 'inspector-title', 'Nothing selected'));
    box.appendChild(el('p', 'inspector-empty',
      'Pick a zone to set who owns it, who can see it, and what it holds. Those three answers are what an engine needs to model a container.'));
    return;
  }

  box.appendChild(el('h2', 'inspector-title', 'Zone'));
  const change = (key, value) => {
    commit((d) => {
      const live = d.board.zones.find((v) => v.id === z.id);
      if (!live) return;
      live[key] = value;
      if (key === 'kind') {
        const k = zoneKind(value);
        if (live.name === zoneKind(z.kind).label) live.name = k.label;
      }
    }, { history: historyGate(`zone:${z.id}:${key}`), silent: true });
    if (key === 'name' || key === 'kind' || key === 'owner' || key === 'visibility' || key === 'capacity') {
      refreshZoneNode(z.id);
      renderZoneList();
    }
    if (key === 'x' || key === 'y' || key === 'w' || key === 'h') refreshZoneNode(z.id);
    if (key === 'kind') renderInspector();
  };

  box.appendChild(buildForm([
    { key: 'name', label: 'Name', type: 'text', maxlength: 40 },
    { key: 'kind', label: 'Kind', type: 'select', options: ZONE_KINDS, hint: zoneKind(z.kind).hint },
    { key: 'owner', label: 'Owner', type: 'select', options: OWNERS },
    { key: 'visibility', label: 'Visibility', type: 'select', options: VISIBILITY },
    { key: 'capacity', label: 'Capacity', type: 'number', min: 0, max: 999, nullable: true, placeholder: 'unlimited' },
    { key: 'accepts', label: 'Holds', type: 'chips', options: acceptOptions, empty: 'Add components or card templates first' },
    {
      type: 'group', label: 'Position and size',
      fields: [
        { key: 'x', label: 'X', type: 'number', min: 0, max: board().width },
        { key: 'y', label: 'Y', type: 'number', min: 0, max: board().height },
        { key: 'w', label: 'W', type: 'number', min: MIN.w, max: board().width },
        { key: 'h', label: 'H', type: 'number', min: MIN.h, max: board().height },
      ],
    },
    { key: 'notes', label: 'Notes for the build', type: 'textarea', rows: 3, placeholder: 'Anything the engine must know that the fields above do not say' },
  ], z, change));

  const row = el('div', 'inspector-actions');
  row.append(
    actionBtn('Duplicate', () => duplicate(z.id)),
    actionBtn('Bring to front', () => reorder(z.id)),
    actionBtn('Delete', () => removeZone(z.id), 'btn--danger'),
  );
  box.appendChild(row);
}

function acceptOptions() {
  const d = state.design;
  return [
    ...d.templates.map((t) => ({ id: t.id, label: `${t.name} (cards)` })),
    ...d.components.map((c) => ({ id: c.id, label: c.name })),
  ];
}

function actionBtn(label, onClick, variant = 'btn--secondary') {
  const b = el('button', `btn ${variant} btn--sm`, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

/** Update one zone's DOM in place — a full re-render would drop input focus. */
function refreshZoneNode(id) {
  const z = zoneById(id);
  const node = stageEl()?.querySelector(`.zone[data-id="${id}"]`);
  if (!z || !node) return;
  const fresh = zoneNode(z);
  node.replaceWith(fresh);
}

export function select(id) {
  state.selectedZone = id;
  stageEl()?.querySelectorAll('.zone.is-selected').forEach((n) => n.classList.remove('is-selected'));
  stageEl()?.querySelector(`.zone[data-id="${id}"]`)?.classList.add('is-selected');
}

function addZone(kind) {
  const existing = zones().length;
  const z = newZone({
    kind,
    x: clamp(60 + (existing % 5) * 60, 0, board().width - 360),
    y: clamp(60 + (existing % 5) * 50, 0, board().height - 220),
  });
  commit((d) => d.board.zones.push(z));
  state.selectedZone = z.id;
  emit();
}

function duplicate(id) {
  const z = zoneById(id);
  if (!z) return;
  const copy = { ...structuredClone(z), id: uid('zone'), name: `${z.name} copy`, x: clamp(z.x + 24, 0, board().width - z.w), y: clamp(z.y + 24, 0, board().height - z.h) };
  commit((d) => d.board.zones.push(copy));
  state.selectedZone = copy.id;
  emit();
}

function reorder(id) {
  commit((d) => {
    const i = d.board.zones.findIndex((z) => z.id === id);
    if (i >= 0) d.board.zones.push(d.board.zones.splice(i, 1)[0]);
  });
  emit();
}

export function removeZone(id) {
  commit((d) => {
    d.board.zones = d.board.zones.filter((z) => z.id !== id);
    // An action pointing at a deleted zone would export as a dangling
    // reference, so clear the pointer and let the linter ask about it.
    d.actions.forEach((a) => {
      if (a.from === id) a.from = '';
      if (a.to === id) a.to = '';
    });
  });
  if (state.selectedZone === id) state.selectedZone = null;
  emit();
}

/** Arrow keys nudge, Delete removes, Cmd/Ctrl+D duplicates. */
export function handleBoardKey(e) {
  const z = zoneById(state.selectedZone);
  if (!z) return false;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    removeZone(z.id);
    return true;
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
    duplicate(z.id);
    return true;
  }
  const step = e.shiftKey ? SNAP_STEP * 5 : SNAP_STEP;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const mv = moves[e.key];
  if (!mv) return false;

  commit((d) => {
    const live = d.board.zones.find((v) => v.id === z.id);
    if (!live) return;
    live.x = clamp(live.x + mv[0], 0, board().width - live.w);
    live.y = clamp(live.y + mv[1], 0, board().height - live.h);
  }, { history: historyGate(`nudge:${z.id}`), silent: true });
  refreshZoneNode(z.id);
  return true;
}

export function setBoardSize(key, value) {
  commit((d) => {
    d.board[key] = clamp(Number(value) || 0, 200, 6000);
    d.board.zones.forEach((z) => {
      z.w = Math.min(z.w, d.board.width);
      z.h = Math.min(z.h, d.board.height);
      z.x = clamp(z.x, 0, d.board.width - z.w);
      z.y = clamp(z.y, 0, d.board.height - z.h);
    });
  }, { history: historyGate(`board:${key}`) });
}
