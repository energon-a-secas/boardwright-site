// ── Modal ────────────────────────────────────────────────────
// Blocking overlay with a focus trap. Lifted out of events.js so both
// the wiring and the confirm helper can use it without a cycle.

function getFocusable(root) {
  const sel = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(root.querySelectorAll(sel)).filter((node) => {
    if (node.hasAttribute('disabled') || node.getAttribute('aria-hidden') === 'true') return false;
    return node.getClientRects().length > 0;
  });
}

let lastFocus = null;

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  lastFocus = document.activeElement;
  modal.removeAttribute('hidden');
  document.body.classList.add('modal-open');
  const dialog = modal.querySelector('.modal__dialog');
  const list = dialog ? getFocusable(dialog) : [];
  const closeBtn = modal.querySelector('.modal__header [data-modal-close]');
  const toFocus = closeBtn && list.includes(closeBtn) ? closeBtn : list[0];
  toFocus?.focus();
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.setAttribute('hidden', '');
  document.body.classList.remove('modal-open');
  if (typeof lastFocus?.focus === 'function') lastFocus.focus();
  lastFocus = null;
}

export const openModalEl = () => document.querySelector('.modal:not([hidden])');

/** Escape closes, Tab cycles inside the dialog. @returns {boolean} handled */
export function handleModalKey(e) {
  const modal = openModalEl();
  if (!modal || !modal.id) return false;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(modal.id);
    return true;
  }
  if (e.key !== 'Tab') return true;

  const dialog = modal.querySelector('.modal__dialog');
  const list = dialog ? getFocusable(dialog) : [];
  if (!list.length) return true;
  const first = list[0];
  const last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
  return true;
}

/** Clicks on the backdrop or any [data-modal-close] dismiss the dialog. */
export function handleModalClick(e) {
  const modal = e.target.closest('.modal');
  if (!modal || modal.hasAttribute('hidden')) return;
  if (e.target.closest('[data-modal-close]')) closeModal(modal.id);
}
