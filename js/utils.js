// Generic helpers come from the DOM Kit (js/neorgon-dom.js, vendored from
// packages/neorgon-ui/dom/). They are re-exported so every existing
// `import { escHtml } from './utils.js'` keeps working.
//
// Do not edit js/neorgon-dom.js. Edit the canonical source and run
// packages/neorgon-ui/sync-dom.sh.
import { escHtml, debounce, showToast as kitToast } from './neorgon-dom.js';
export { escHtml, debounce };

// ── Shared utilities ─────────────────────────────────────────

import { openModal, closeModal } from './modal.js';

/** Cached element lookup by ID. */
const _els = {};
export function $(id) {
  return _els[id] || (_els[id] = document.getElementById(id));
}


/** Show a temporary toast notification. */
/** This site's own toast contract, rendered by the kit. */
export function showToast(msg) {
  return kitToast(msg, { id: 'app-toast', className: 'toast',
    visibleClass: 'visible', duration: 2400 });
}



/**
 * Ask before something destructive. The confirm button is rebuilt each
 * time so a previous caller's handler cannot fire on the next answer.
 */
export function confirmAction(title, body, onOk, okLabel = 'Replace') {
  $('confirmTitle').textContent = title;
  $('confirmBody').textContent = body;
  const old = $('confirmOk');
  const fresh = old.cloneNode(true);
  fresh.textContent = okLabel;
  old.replaceWith(fresh);
  _els.confirmOk = fresh;
  fresh.addEventListener('click', () => {
    closeModal('confirmModal');
    onOk();
  });
  openModal('confirmModal');
}
