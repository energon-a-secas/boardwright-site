// ── Go to the problem ────────────────────────────────────────
// The readiness check knows what is wrong and where. Without this the
// reader has to carry "Class Deck" in their head, switch tabs, and hunt
// for it — which is the step at which people stop fixing things.

import { state } from './state.js';
import { setView } from './render.js';
import { select as selectZone } from './board.js';

/**
 * Switch to the view that owns a finding and put the offending thing on
 * screen, selected.
 * @param {{view: string, zone?: string, entry?: string, template?: string,
 *          field?: string, anchor?: string}} target
 */
export function goTo(target) {
  if (!target || !target.view) return;

  if (target.zone) state.selectedZone = target.zone;
  if (target.template) {
    state.selectedTemplate = target.template;
    state.selectedField = target.field || null;
  }

  setView(target.view);

  // The view has just rebuilt, so the node to reveal exists only now.
  requestAnimationFrame(() => {
    if (target.zone) {
      selectZone(target.zone);
      flash(document.querySelector(`.zone[data-id="${target.zone}"]`));
      flash(document.querySelector(`#zoneList .rail-item.is-on`));
    }
    if (target.field) flash(document.querySelector(`.slot[data-id="${target.field}"]`));
    else if (target.template) flash(document.querySelector('#cardStage'));

    const node = target.entry
      ? document.querySelector(`[data-entry-id="${target.entry}"]`)
      : target.anchor
        ? document.querySelector(`[data-panel="${target.anchor}"]`)
        : null;
    if (node) {
      node.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      flash(node);
      focusFirstInput(node);
    }
  });
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Brief outline so the eye lands on the right row without a colour change. */
function flash(node) {
  if (!node) return;
  node.classList.remove('is-flash');
  // Force a reflow so re-adding the class restarts the animation.
  void node.offsetWidth;
  node.classList.add('is-flash');
  setTimeout(() => node.classList.remove('is-flash'), 1600);
}

/**
 * Land the caret where the fix gets typed. Skipped under reduced motion's
 * sibling concern: a focus jump during a smooth scroll fights the scroll.
 */
function focusFirstInput(node) {
  const input = node.querySelector('input[type="text"], textarea, select');
  if (!input) return;
  setTimeout(() => input.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 320);
}
