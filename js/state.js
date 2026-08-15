// ── State ────────────────────────────────────────────────────
// One design in memory, mirrored to localStorage. Every mutation goes
// through commit() so undo, persistence and re-render stay in step.

import { blankDesign, migrate } from './model.js';

const STORAGE_KEY = 'boardwright.design.v1';
const HISTORY_MAX = 40;

export const state = {
  design: blankDesign(),
  view: 'board',
  selectedZone: null,
  selectedTemplate: null,
  selectedField: null,
  selectedVariant: null,
  snap: true,
  findings: [],
  history: [],
  dirty: false,
};

const listeners = new Set();
const quietListeners = new Set();

/** Subscribe to full re-renders. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Subscribe to *every* mutation, including the silent ones a re-render would
 * ruin (typing in a text field). For work that must not touch the DOM the
 * user is editing — recounting findings, stamping the title.
 */
export function subscribeQuiet(fn) {
  quietListeners.add(fn);
  return () => quietListeners.delete(fn);
}

export function emit() {
  listeners.forEach((fn) => fn(state));
}

/**
 * Tell the quiet channel the design changed. Every path that replaces or
 * rewinds the design must call this, not just commit(): the readiness check
 * subscribes here, and skipping it left the Check tab showing the *previous*
 * design's findings after a load, an import or an undo, until the next edit
 * happened to refresh them.
 */
function notifyQuiet() {
  quietListeners.forEach((l) => l(state));
}

/**
 * Apply a mutation to the design.
 * @param {(d: object) => void} fn      mutates the design in place
 * @param {{history?: boolean, silent?: boolean}} [opts]
 *   history:false for the continuous frames of a drag — the pointerdown
 *   already pushed one snapshot, and 60 of them per second would bury it.
 */
export function commit(fn, opts = {}) {
  if (opts.history !== false) pushHistory();
  fn(state.design);
  state.dirty = true;
  save();
  notifyQuiet();
  if (!opts.silent) emit();
}

export function pushHistory() {
  state.history.push(JSON.stringify(state.design));
  if (state.history.length > HISTORY_MAX) state.history.shift();
}

export function undo() {
  const prev = state.history.pop();
  if (!prev) return false;
  try {
    state.design = JSON.parse(prev);
  } catch {
    return false;
  }
  reconcileSelection();
  save();
  notifyQuiet();
  emit();
  return true;
}

export const canUndo = () => state.history.length > 0;

let _gateKey = '';
let _gateAt = 0;
/**
 * Typing into a text field fires a mutation per keystroke. Snapshotting each
 * one would push the previous edit out of a 40-deep stack in half a sentence,
 * so a run of edits to the same field collapses into one undo step.
 * @param {string} key  identifies the field being edited
 */
export function historyGate(key) {
  const now = Date.now();
  const fresh = key !== _gateKey || now - _gateAt > 1200;
  _gateKey = key;
  _gateAt = now;
  return fresh;
}

/** Replace the whole design (import, sample, reset). Undoable. */
export function replaceDesign(raw) {
  pushHistory();
  state.design = migrate(raw);
  state.selectedZone = null;
  state.selectedField = null;
  state.selectedVariant = null;
  state.selectedTemplate = state.design.templates[0]?.id || null;
  save();
  notifyQuiet();
  emit();
}

/** Drop selections that point at something the design no longer contains. */
function reconcileSelection() {
  const d = state.design;
  if (!d.board.zones.some((z) => z.id === state.selectedZone)) state.selectedZone = null;
  const tpl = d.templates.find((t) => t.id === state.selectedTemplate);
  if (!tpl) {
    state.selectedTemplate = d.templates[0]?.id || null;
    state.selectedField = null;
  } else if (!tpl.fields.some((f) => f.id === state.selectedField)) {
    state.selectedField = null;
  }
}

export const zones = () => state.design.board.zones;
export const zoneById = (id) => zones().find((z) => z.id === id) || null;
export const activeTemplate = () =>
  state.design.templates.find((t) => t.id === state.selectedTemplate) || state.design.templates[0] || null;
export const activeField = () => {
  const tpl = activeTemplate();
  return tpl ? tpl.fields.find((f) => f.id === state.selectedField) || null : null;
};

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.design));
  } catch { /* quota exceeded or private browsing */ }
}

/** @returns {boolean} true if a stored design was found */
export function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    state.design = migrate(JSON.parse(raw));
    state.selectedTemplate = state.design.templates[0]?.id || null;
    return true;
  } catch {
    return false;
  }
}
