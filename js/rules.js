// ── Rules view ───────────────────────────────────────────────
// The half of the design that is not a picture: what is in the box,
// what order things happen in, what a player may do, and how it ends.
// This is the part that turns a mockup into something an engine can run.

import { COMPONENT_KINDS, WIN_KINDS, newComponent, newPhase, newAction, newWin } from './model.js';
import { state, commit, historyGate, emit } from './state.js';
import { buildForm, el, panel, listRow } from './forms.js';
import { $ } from './utils.js';

export function renderRules() {
  const pane = $('rulesPane');
  pane.textContent = '';
  pane.append(overviewPanel(), componentsPanel(), phasesPanel(), actionsPanel(), winPanel());
}

/* ── Overview ─────────────────────────────────────────────── */

function overviewPanel() {
  const p = panel('Overview', { hint: 'The header of every export. Players and playtime shape the engine as much as the rules do.' });
  const meta = state.design.meta;
  p.body.appendChild(buildForm([
    { key: 'name', label: 'Game name', type: 'text', maxlength: 60 },
    { key: 'tagline', label: 'Tagline', type: 'text', maxlength: 90, placeholder: 'One line a player would repeat' },
    {
      type: 'group', label: 'Table',
      fields: [
        { key: 'minPlayers', label: 'Min players', type: 'number', min: 1, max: 12 },
        { key: 'maxPlayers', label: 'Max players', type: 'number', min: 1, max: 12 },
        { key: 'playtime', label: 'Minutes', type: 'number', min: 5, max: 300, step: 5 },
      ],
    },
    { key: 'notes', label: 'Designer notes', type: 'textarea', rows: 3, placeholder: 'Tone, theme, anything the build should feel like' },
  ], meta, (key, value) => {
    commit((d) => { d.meta[key] = value; }, { history: historyGate(`meta:${key}`), silent: true });
    if (key === 'name') $('docName').textContent = value || 'Untitled';
  }));
  return p;
}

/* ── Components ───────────────────────────────────────────── */

function componentsPanel() {
  const p = panel('Components', {
    action: 'Add component',
    onAction: () => { commit((d) => d.components.push(newComponent())); emit(); },
    hint: 'What is physically in the box. Counts matter: an engine has to know when the supply runs out.',
  });

  if (!state.design.components.length) {
    p.body.appendChild(el('p', 'panel-empty', 'Nothing in the box yet.'));
    return p;
  }

  state.design.components.forEach((c) => {
    const row = listRow(() => {
      commit((d) => {
        d.components = d.components.filter((v) => v.id !== c.id);
        d.board.zones.forEach((z) => { z.accepts = z.accepts.filter((a) => a !== c.id); });
      });
      emit();
    });
    row.insertBefore(buildForm([
      { key: 'name', label: 'Name', type: 'text', maxlength: 40 },
      { key: 'kind', label: 'Kind', type: 'select', options: COMPONENT_KINDS },
      { key: 'count', label: 'Count', type: 'number', min: 1, max: 999 },
      { key: 'perPlayer', label: 'Per player', type: 'checkbox' },
    ], c, edit('components', c.id)), row.firstChild);
    p.body.appendChild(row);
  });
  return p;
}

/* ── Phases ───────────────────────────────────────────────── */

function phasesPanel() {
  const p = panel('Turn structure', {
    action: 'Add phase',
    onAction: () => { commit((d) => d.phases.push(newPhase({ name: `Phase ${d.phases.length + 1}` }))); emit(); },
    hint: 'Phases run top to bottom, once per turn. Actions below hang off them.',
  });

  if (!state.design.phases.length) {
    p.body.appendChild(el('p', 'panel-empty', 'No phases yet. Most games need at least one.'));
    return p;
  }

  state.design.phases.forEach((ph, i) => {
    const row = listRow(() => {
      commit((d) => {
        d.phases = d.phases.filter((v) => v.id !== ph.id);
        d.actions.forEach((a) => { if (a.phase === ph.id) a.phase = ''; });
      });
      emit();
    });
    const order = el('div', 'order-btns');
    order.append(
      moveBtn('Move up', '↑', i > 0, () => movePhase(i, -1)),
      el('span', 'order-index', String(i + 1)),
      moveBtn('Move down', '↓', i < state.design.phases.length - 1, () => movePhase(i, 1)),
    );
    row.insertBefore(order, row.firstChild);
    row.insertBefore(buildForm([
      { key: 'name', label: 'Phase', type: 'text', maxlength: 40 },
      { key: 'notes', label: 'What happens', type: 'text', placeholder: 'Refill the market to five cards' },
    ], ph, edit('phases', ph.id)), row.lastChild);
    p.body.appendChild(row);
  });
  return p;
}

function movePhase(i, delta) {
  commit((d) => {
    const j = i + delta;
    if (j < 0 || j >= d.phases.length) return;
    [d.phases[i], d.phases[j]] = [d.phases[j], d.phases[i]];
  });
  emit();
}

function moveBtn(label, glyph, enabled, onClick) {
  const b = el('button', 'order-btn', glyph);
  b.type = 'button';
  b.title = label;
  b.setAttribute('aria-label', label);
  b.disabled = !enabled;
  b.addEventListener('click', onClick);
  return b;
}

/* ── Actions ──────────────────────────────────────────────── */

function actionsPanel() {
  const p = panel('Actions', {
    action: 'Add action',
    onAction: () => { commit((d) => d.actions.push(newAction())); emit(); },
    hint: 'One row per legal move. From and To are the zones a component travels between, which is what the engine actually executes.',
  });

  if (!state.design.actions.length) {
    p.body.appendChild(el('p', 'panel-empty', 'No actions yet. Without them the export describes a board nobody can touch.'));
    return p;
  }

  const zoneOpts = () => state.design.board.zones.map((z) => ({ id: z.id, label: z.name }));
  const phaseOpts = () => state.design.phases.map((ph) => ({ id: ph.id, label: ph.name }));

  state.design.actions.forEach((a) => {
    const row = listRow(() => {
      commit((d) => { d.actions = d.actions.filter((v) => v.id !== a.id); });
      emit();
    });
    row.classList.add('list-row--wide');
    row.insertBefore(buildForm([
      { key: 'name', label: 'Action', type: 'text', maxlength: 40 },
      { key: 'phase', label: 'Phase', type: 'select', options: phaseOpts, blank: 'Any phase' },
      { key: 'from', label: 'From', type: 'select', options: zoneOpts, blank: 'Nowhere' },
      { key: 'to', label: 'To', type: 'select', options: zoneOpts, blank: 'Nowhere' },
      { key: 'limit', label: 'Limit', type: 'text', placeholder: '3 per turn' },
      { key: 'requires', label: 'Requires', type: 'text', placeholder: 'Coins at least the card cost' },
      { key: 'effect', label: 'Effect', type: 'text', placeholder: 'Pay the cost, then refill the market' },
    ], a, edit('actions', a.id)), row.firstChild);
    p.body.appendChild(row);
  });
  return p;
}

/* ── Win conditions ───────────────────────────────────────── */

function winPanel() {
  const p = panel('How it ends', {
    action: 'Add condition',
    onAction: () => { commit((d) => d.win.push(newWin())); emit(); },
    hint: 'The trigger is the check the engine runs. Say when it is evaluated, not only what wins.',
  });

  if (!state.design.win.length) {
    p.body.appendChild(el('p', 'panel-empty', 'No end condition yet. A game that cannot end cannot be built.'));
    return p;
  }

  state.design.win.forEach((w) => {
    const row = listRow(() => {
      commit((d) => { d.win = d.win.filter((v) => v.id !== w.id); });
      emit();
    });
    row.classList.add('list-row--wide');
    row.insertBefore(buildForm([
      { key: 'name', label: 'Name', type: 'text', maxlength: 40 },
      { key: 'kind', label: 'Kind', type: 'select', options: WIN_KINDS },
      { key: 'trigger', label: 'Checked when', type: 'text', placeholder: 'The deck runs out at the end of a round' },
      { key: 'notes', label: 'Tiebreak and detail', type: 'text', placeholder: 'Fewest cards played wins ties' },
    ], w, edit('win', w.id)), row.firstChild);
    p.body.appendChild(row);
  });
  return p;
}

/* ── Shared edit handler ──────────────────────────────────── */

/**
 * Every edit here is silent: nothing in a row derives from another row, and
 * re-rendering would take the caret out of the field being typed in. The
 * findings badge still updates, through the quiet channel in state.js.
 * @param {string} coll collection name on the design
 * @param {string} id   entry id
 */
function edit(coll, id) {
  return (key, value) => {
    commit((d) => {
      const live = d[coll].find((v) => v.id === id);
      if (live) live[key] = value;
    }, { history: historyGate(`${coll}:${id}:${key}`), silent: true });
  };
}
