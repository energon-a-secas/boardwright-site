// ── Cards view ───────────────────────────────────────────────
// A card template is a size plus a set of slots. Slots are stored as
// percentages of the face so the exported spec survives any print size
// or screen resolution the implementer picks.

import { FIELD_TYPES, CARD_PRESETS, newTemplate, newField, fieldType, uid } from './model.js';
import { state, commit, activeTemplate, activeField, historyGate, emit } from './state.js';
import { buildForm, el } from './forms.js';
import { attachRect, addHandles } from './drag.js';
import { $ } from './utils.js';

const MIN = { w: 5, h: 4 };
const SNAP = 1;
/** px per mm at the editor's working size. */
const MM = 4.2;

const stageEl = () => $('cardStage');

export function renderCards() {
  const tpl = activeTemplate();
  if (state.selectedTemplate !== tpl?.id) state.selectedTemplate = tpl?.id || null;

  renderTemplateList();
  renderFieldPalette();
  renderSizeBar(tpl);
  renderFace(tpl);
  renderInspector(tpl);
}

function renderTemplateList() {
  const list = $('tplList');
  const tpls = state.design.templates;
  list.textContent = '';
  $('tplCount').textContent = String(tpls.length);

  if (!tpls.length) {
    list.appendChild(el('li', 'rail-empty', 'No card templates yet. Games without cards can skip this whole tab.'));
    return;
  }
  tpls.forEach((t) => {
    const li = el('li', 'rail-item');
    if (t.id === state.selectedTemplate) li.classList.add('is-on');
    const btn = el('button', 'rail-item-btn');
    btn.type = 'button';
    btn.append(
      el('span', 'rail-item-name', t.name),
      el('span', 'rail-item-sub', `${t.w}x${t.h}mm · ${t.fields.length} slots`),
    );
    btn.addEventListener('click', () => {
      state.selectedTemplate = t.id;
      state.selectedField = null;
      emit();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderFieldPalette() {
  const grid = $('fieldKindGrid');
  grid.textContent = '';
  const disabled = !activeTemplate();
  FIELD_TYPES.forEach((t) => {
    const btn = el('button', 'kind-btn kind-btn--plain');
    btn.type = 'button';
    btn.disabled = disabled;
    btn.append(el('span', 'kind-label', t.label));
    btn.addEventListener('click', () => addField(t.id));
    grid.appendChild(btn);
  });
}

function renderSizeBar(tpl) {
  const bar = $('cardSizeBar');
  bar.textContent = '';
  if (!tpl) return;

  const sel = el('select', 'form-input form-input--inline');
  CARD_PRESETS.forEach((p) => sel.appendChild(new Option(p.label, p.id)));
  sel.appendChild(new Option('Custom', 'custom'));
  const match = CARD_PRESETS.find((p) => p.w === tpl.w && p.h === tpl.h);
  sel.value = match ? match.id : 'custom';
  sel.setAttribute('aria-label', 'Card size preset');
  sel.addEventListener('change', () => {
    const preset = CARD_PRESETS.find((p) => p.id === sel.value);
    if (!preset) return;
    commit((d) => {
      const live = d.templates.find((t) => t.id === tpl.id);
      if (live) { live.w = preset.w; live.h = preset.h; }
    });
    emit();
  });
  bar.appendChild(sel);

  const wrap = el('label', 'mini-field');
  wrap.appendChild(el('span', '', 'mm'));
  ['w', 'h'].forEach((key, i) => {
    if (i) wrap.appendChild(el('span', 'times', 'x'));
    const inp = el('input', '');
    inp.type = 'number';
    inp.min = 20; inp.max = 300;
    inp.value = tpl[key];
    inp.setAttribute('aria-label', key === 'w' ? 'Card width in mm' : 'Card height in mm');
    inp.addEventListener('input', () => {
      commit((d) => {
        const live = d.templates.find((t) => t.id === tpl.id);
        if (live) live[key] = Math.min(Math.max(Number(inp.value) || 20, 20), 300);
      }, { history: historyGate(`tpl:${tpl.id}:${key}`), silent: true });
      renderFace(activeTemplate());
    });
    wrap.appendChild(inp);
  });
  bar.appendChild(wrap);
}

function renderFace(tpl) {
  const stage = stageEl();
  if (!stage) return;
  stage.textContent = '';

  if (!tpl) {
    stage.classList.add('is-empty');
    stage.removeAttribute('style');
    stage.appendChild(el('p', 'stage-empty', 'No template selected.'));
    return;
  }

  stage.classList.remove('is-empty');
  stage.style.width = `${tpl.w * MM}px`;
  stage.style.height = `${tpl.h * MM}px`;
  stage.style.borderRadius = `${tpl.corner * MM}px`;

  tpl.fields.forEach((f) => stage.appendChild(fieldNode(tpl, f)));
}

function fieldNode(tpl, f) {
  const node = el('div', `slot slot--${f.type} slot--${f.size}`);
  node.dataset.id = f.id;
  node.dataset.align = f.align;
  node.dataset.label = f.label;
  node.title = `${f.label} (${fieldType(f.type).label})`;
  if (f.id === state.selectedField) node.classList.add('is-selected');
  place(node, f);

  if (f.type === 'art' || f.type === 'icon') {
    node.appendChild(el('span', 'slot-ph', f.label));
  } else {
    node.appendChild(el('span', 'slot-text', f.sample || f.label));
  }
  addHandles(node);

  attachRect(node, {
    getRect: () => ({ x: f.x, y: f.y, w: f.w, h: f.h }),
    setRect: (r, final) => {
      const next = {
        x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10,
        w: Math.round(r.w * 10) / 10, h: Math.round(r.h * 10) / 10,
      };
      commit((d) => {
        const live = d.templates.find((t) => t.id === tpl.id)?.fields.find((v) => v.id === f.id);
        if (live) Object.assign(live, next);
      }, { history: false, silent: !final });
      Object.assign(f, next);
      place(node, f);
      if (final) emit();
    },
    scale: () => stageEl().clientWidth / 100,
    scaleY: () => stageEl().clientHeight / 100,
    bounds: () => ({ w: 100, h: 100 }),
    snap: () => (state.snap ? SNAP : 0),
    min: MIN,
    onStart: () => { commit(() => {}, { silent: true }); },
    onSelect: () => {
      state.selectedField = f.id;
      stageEl().querySelectorAll('.slot.is-selected').forEach((n) => n.classList.remove('is-selected'));
      node.classList.add('is-selected');
      renderInspector(activeTemplate());
    },
  });

  return node;
}

function place(node, f) {
  node.style.left = `${f.x}%`;
  node.style.top = `${f.y}%`;
  node.style.width = `${f.w}%`;
  node.style.height = `${f.h}%`;
}

function renderInspector(tpl) {
  const box = $('cardInspector');
  box.textContent = '';

  if (!tpl) {
    box.appendChild(el('h2', 'inspector-title', 'No template'));
    box.appendChild(el('p', 'inspector-empty', 'Create a template to lay out a card face.'));
    return;
  }

  box.appendChild(el('h2', 'inspector-title', 'Template'));
  box.appendChild(buildForm([
    { key: 'name', label: 'Name', type: 'text', maxlength: 40 },
    {
      type: 'group', label: 'Print run',
      fields: [
        { key: 'count', label: 'Copies', type: 'number', min: 1, max: 999 },
        { key: 'corner', label: 'Corner mm', type: 'number', min: 0, max: 20 },
      ],
    },
    { key: 'notes', label: 'Notes', type: 'textarea', rows: 2, placeholder: 'How this deck behaves' },
  ], tpl, (key, value) => {
    commit((d) => {
      const live = d.templates.find((t) => t.id === tpl.id);
      if (live) live[key] = value;
    }, { history: historyGate(`tpl:${tpl.id}:${key}`), silent: true });
    if (key === 'name') renderTemplateList();
    if (key === 'corner') renderFace(activeTemplate());
  }));

  const tplActions = el('div', 'inspector-actions');
  tplActions.append(
    btn('Duplicate', () => duplicateTemplate(tpl.id)),
    btn('Delete', () => removeTemplate(tpl.id), 'btn--danger'),
  );
  box.appendChild(tplActions);

  const f = activeField();
  box.appendChild(el('h2', 'inspector-title', 'Slot'));
  if (!f) {
    box.appendChild(el('p', 'inspector-empty', 'Pick a slot on the face, or add one from the left.'));
    return;
  }

  box.appendChild(buildForm([
    { key: 'label', label: 'Label', type: 'text', maxlength: 30, hint: 'The engine uses this as the data key' },
    { key: 'type', label: 'Type', type: 'select', options: FIELD_TYPES },
    { key: 'sample', label: 'Sample value', type: 'text', placeholder: fieldType(f.type).sample || 'shown in the preview' },
    {
      type: 'group', label: 'Placement (% of face)',
      fields: [
        { key: 'x', label: 'X', type: 'number', min: 0, max: 100, step: 0.5 },
        { key: 'y', label: 'Y', type: 'number', min: 0, max: 100, step: 0.5 },
        { key: 'w', label: 'W', type: 'number', min: MIN.w, max: 100, step: 0.5 },
        { key: 'h', label: 'H', type: 'number', min: MIN.h, max: 100, step: 0.5 },
      ],
    },
    {
      type: 'group', label: 'Style',
      fields: [
        { key: 'align', label: 'Align', type: 'select', options: [{ id: 'left', label: 'Left' }, { id: 'center', label: 'Center' }, { id: 'right', label: 'Right' }] },
        { key: 'size', label: 'Size', type: 'select', options: [{ id: 'sm', label: 'Small' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Large' }] },
      ],
    },
  ], f, (key, value) => {
    commit((d) => {
      const live = d.templates.find((t) => t.id === tpl.id)?.fields.find((v) => v.id === f.id);
      if (!live) return;
      live[key] = value;
      if (key === 'type' && !live.sample) live.sample = fieldType(value).sample;
    }, { history: historyGate(`fld:${f.id}:${key}`), silent: true });
    renderFace(activeTemplate());
    if (key === 'type') renderInspector(activeTemplate());
  }));

  const fieldActions = el('div', 'inspector-actions');
  fieldActions.append(
    btn('Duplicate', () => duplicateField(tpl.id, f.id)),
    btn('Delete', () => removeField(tpl.id, f.id), 'btn--danger'),
  );
  box.appendChild(fieldActions);
}

function btn(label, onClick, variant = 'btn--secondary') {
  const b = el('button', `btn ${variant} btn--sm`, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function addTemplate() {
  const tpl = newTemplate({ name: `Card ${state.design.templates.length + 1}` });
  commit((d) => d.templates.push(tpl));
  state.selectedTemplate = tpl.id;
  state.selectedField = null;
  emit();
}

function duplicateTemplate(id) {
  const src = state.design.templates.find((t) => t.id === id);
  if (!src) return;
  const copy = structuredClone(src);
  copy.id = uid('tpl');
  copy.name = `${src.name} copy`;
  copy.fields = copy.fields.map((f) => ({ ...f, id: uid('fld') }));
  commit((d) => d.templates.push(copy));
  state.selectedTemplate = copy.id;
  state.selectedField = null;
  emit();
}

function removeTemplate(id) {
  commit((d) => {
    d.templates = d.templates.filter((t) => t.id !== id);
    d.board.zones.forEach((z) => { z.accepts = z.accepts.filter((a) => a !== id); });
  });
  state.selectedTemplate = state.design.templates[0]?.id || null;
  state.selectedField = null;
  emit();
}

function addField(type) {
  const tpl = activeTemplate();
  if (!tpl) return;
  const f = newField({ type, y: Math.min(8 + tpl.fields.length * 4, 88) });
  commit((d) => d.templates.find((t) => t.id === tpl.id)?.fields.push(f));
  state.selectedField = f.id;
  emit();
}

function duplicateField(tplId, fieldId) {
  const src = state.design.templates.find((t) => t.id === tplId)?.fields.find((f) => f.id === fieldId);
  if (!src) return;
  const copy = { ...src, id: uid('fld'), y: Math.min(src.y + 4, 100 - src.h) };
  commit((d) => d.templates.find((t) => t.id === tplId)?.fields.push(copy));
  state.selectedField = copy.id;
  emit();
}

function removeField(tplId, fieldId) {
  commit((d) => {
    const live = d.templates.find((t) => t.id === tplId);
    if (live) live.fields = live.fields.filter((f) => f.id !== fieldId);
  });
  if (state.selectedField === fieldId) state.selectedField = null;
  emit();
}

/** Delete removes the selected slot while the card stage has focus. */
export function handleCardKey(e) {
  const tpl = activeTemplate();
  const f = activeField();
  if (!tpl || !f) return false;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    removeField(tpl.id, f.id);
    return true;
  }
  const step = e.shiftKey ? 5 : 1;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const mv = moves[e.key];
  if (!mv) return false;
  commit((d) => {
    const live = d.templates.find((t) => t.id === tpl.id)?.fields.find((v) => v.id === f.id);
    if (!live) return;
    live.x = Math.min(Math.max(live.x + mv[0], 0), 100 - live.w);
    live.y = Math.min(Math.max(live.y + mv[1], 0), 100 - live.h);
  }, { history: historyGate(`fldnudge:${f.id}`), silent: true });
  renderFace(activeTemplate());
  return true;
}
