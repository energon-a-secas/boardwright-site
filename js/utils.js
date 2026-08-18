// ── Shared utilities ─────────────────────────────────────────

import { openModal, closeModal } from './modal.js';

/** Cached element lookup by ID. */
const _els = {};
export function $(id) {
  return _els[id] || (_els[id] = document.getElementById(id));
}

/** Escape HTML special characters. */
export function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Show a temporary toast notification. */
let _toastTimer = null;
export function showToast(msg) {
  let node = document.getElementById('app-toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'app-toast';
    node.className = 'toast';
    node.setAttribute('role', 'status');
    document.body.appendChild(node);
  }
  // Announced by screen readers. Without these the toast is
  // invisible to anyone not looking at that corner of the screen.
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  node.textContent = msg;
  node.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => node.classList.remove('visible'), 2400);
}

/** Simple debounce. */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
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
