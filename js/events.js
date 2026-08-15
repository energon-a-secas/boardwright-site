// ── Event wiring ─────────────────────────────────────────────

import { state, commit, undo, replaceDesign, subscribe, subscribeQuiet } from './state.js';
import { render, setView, VIEWS } from './render.js';
import { handleBoardKey, setBoardSize } from './board.js';
import { handleCardKey, addTemplate } from './cards.js';
import { refreshFindings } from './report.js';
import { handleModalKey, handleModalClick, openModalEl, openModal } from './modal.js';
import { SHORTCUTS, localiseCombo } from './shortcuts.js';
import { el } from './forms.js';
import { $, showToast, debounce, confirmAction } from './utils.js';

export function bindEvents() {
  subscribe(render);
  subscribeQuiet(debounce(refreshFindings, 250));

  document.querySelectorAll('.viewtab').forEach((tab) => {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  });

  window.addEventListener('hashchange', () => {
    const view = location.hash.slice(1);
    if (VIEWS.includes(view) && view !== state.view) setView(view);
  });

  $('exportBtn').addEventListener('click', () => setView('export'));
  $('keysBtn').addEventListener('click', showKeys);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', onImport);

  $('boardW').addEventListener('input', (e) => setBoardSize('width', e.target.value));
  $('boardH').addEventListener('input', (e) => setBoardSize('height', e.target.value));
  $('snapToggle').addEventListener('change', (e) => { state.snap = e.target.checked; });
  $('undoBtn').addEventListener('click', doUndo);
  $('addTplBtn').addEventListener('click', addTemplate);

  document.addEventListener('click', handleModalClick);
  document.addEventListener('keydown', onKeydown);

  // Clicking the empty stage clears the selection, so the inspector stops
  // describing something the pointer is no longer on.
  $('boardStage').addEventListener('pointerdown', (e) => {
    if (e.target === $('boardStage')) {
      state.selectedZone = null;
      render();
    }
  });
  $('cardStage').addEventListener('pointerdown', (e) => {
    if (e.target === $('cardStage')) {
      state.selectedField = null;
      render();
    }
  });

  // The board scales to its pane, so a resized window needs a re-measure.
  const onResize = debounce(() => { if (state.view === 'board') render(); }, 120);
  window.addEventListener('resize', onResize);
}

function onKeydown(e) {
  if (openModalEl()) {
    handleModalKey(e);
    return;
  }

  const target = e.target;
  const typing = target instanceof HTMLElement
    && (target.matches('input, textarea, select') || target.isContentEditable);

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault();
    doUndo();
    return;
  }
  if (typing) return;

  // `?` is shift+/ on most layouts, so match the produced character.
  if (e.key === '?') {
    e.preventDefault();
    showKeys();
    return;
  }

  // Digits jump between views the way a tab bar would.
  const idx = Number(e.key) - 1;
  if (!e.metaKey && !e.ctrlKey && idx >= 0 && idx < VIEWS.length) {
    e.preventDefault();
    setView(VIEWS[idx]);
    return;
  }

  if (state.view === 'board' && handleBoardKey(e)) e.preventDefault();
  else if (state.view === 'cards' && handleCardKey(e)) e.preventDefault();
}

/** Built from the declared table, so it cannot drift from the bindings. */
function showKeys() {
  const body = $('keysBody');
  body.textContent = '';
  SHORTCUTS.forEach((group) => {
    const sec = el('section', 'keys-group');
    sec.appendChild(el('h3', 'keys-group-title', group.group));
    const list = el('dl', 'keys-list');
    group.keys.forEach((k) => {
      const dt = el('dt', 'keys-combo');
      localiseCombo(k.combo).forEach((key, i) => {
        // `any` means these are alternatives; a `+` between them would claim
        // you hold all four arrows down at once.
        if (i && !k.any) dt.appendChild(el('span', 'keys-plus', '+'));
        dt.appendChild(el('kbd', '', key));
      });
      list.append(dt, el('dd', 'keys-label', k.label));
    });
    sec.appendChild(list);
    body.appendChild(sec);
  });
  openModal('keysModal');
}

function doUndo() {
  if (undo()) showToast('Undone');
  else showToast('Nothing to undo');
}

function onImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(String(reader.result));
    } catch {
      showToast('That file is not valid JSON');
      return;
    }
    const name = parsed?.meta?.name || file.name;
    confirmAction('Replace this design?', `Loading "${name}" clears what is on screen. Undo brings it back.`, () => {
      replaceDesign(parsed);
      showToast(`Loaded ${name}`);
    });
  };
  reader.onerror = () => showToast('Could not read that file');
  reader.readAsText(file);
  e.target.value = '';
}

export { commit };
