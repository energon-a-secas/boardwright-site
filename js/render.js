// ── Render ───────────────────────────────────────────────────
// Routes to the active view and renders only that one. The other views
// are rebuilt when they come back into sight, which keeps a keystroke
// in the Rules tab from touching the board's DOM.

import { state } from './state.js';
import { renderBoard } from './board.js';
import { renderCards } from './cards.js';
import { renderRules } from './rules.js';
import { renderCheck, renderExport } from './report.js';
import { $ } from './utils.js';

export const VIEWS = ['board', 'cards', 'rules', 'check', 'export'];

export function render() {
  const view = VIEWS.includes(state.view) ? state.view : 'board';

  VIEWS.forEach((name) => {
    const section = document.getElementById(`view-${name}`);
    const active = name === view;
    section.hidden = !active;
    section.classList.toggle('is-active', active);
  });

  document.querySelectorAll('.viewtab').forEach((tab) => {
    const active = tab.dataset.view === view;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-current', active ? 'page' : 'false');
  });

  $('docName').textContent = state.design.meta.name || 'Untitled';

  switch (view) {
    case 'board': renderBoard(); break;
    case 'cards': renderCards(); break;
    case 'rules': renderRules(); break;
    case 'check': renderCheck(); break;
    case 'export': renderExport(); break;
    default: break;
  }
}

export function setView(view) {
  if (!VIEWS.includes(view)) return;
  state.view = view;
  if (location.hash.slice(1) !== view) location.hash = view;
  render();
}
