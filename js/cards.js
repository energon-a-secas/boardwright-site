// ── Cards view ───────────────────────────────────────────────
// A card template is a size plus a set of slots. Slots are stored as
// percentages of the face so the exported spec survives any print size
// or screen resolution the implementer picks.

import {
  FIELD_TYPES, CARD_PRESETS, CARD_FRAMES, SLOT_SHAPES, SLOT_FILLS,
  newTemplate, newField, newVariant, fieldType, slotIcon, uid,
} from './model.js';
import { ICONS, ICON_GROUPS, iconSvg } from './icons.js';
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

  if (tpl && !tpl.variants.some((v) => v.id === state.selectedVariant)) state.selectedVariant = null;

  renderTemplateList();
  renderFieldPalette();
  renderSizeBar(tpl);
  renderFace(tpl);
  renderVariantStrip(tpl);
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
    btn.dataset.type = t.id;
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

/** The colours the face is currently painted in: base, or the picked variant. */
export function paint(tpl) {
  const v = tpl.variants.find((x) => x.id === state.selectedVariant);
  return v ? { bg: v.bg, ink: v.ink, accent: tpl.accent, name: v.name, variant: v }
           : { bg: tpl.bg, ink: tpl.ink, accent: tpl.accent, name: 'Base', variant: null };
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

  const c = paint(tpl);
  stage.classList.remove('is-empty');
  stage.style.width = `${tpl.w * MM}px`;
  stage.style.height = `${tpl.h * MM}px`;
  stage.style.borderRadius = `${tpl.corner * MM}px`;
  stage.style.background = c.bg;
  stage.style.color = c.ink;
  stage.style.setProperty('--ink', c.ink);
  stage.style.setProperty('--face', c.bg);
  stage.style.setProperty('--card-accent', c.accent);
  stage.style.boxShadow = tpl.border ? `inset 0 0 0 ${Math.max(tpl.w * MM * 0.018, 2)}px ${c.ink}` : 'none';

  if (tpl.frame === 'oval' || tpl.frame === 'both') {
    const oval = el('div', 'face-oval');
    oval.style.borderWidth = `${Math.max(tpl.w * MM * 0.045, 3)}px`;
    stage.appendChild(oval);
  }
  if (tpl.frame === 'wedges' || tpl.frame === 'both') {
    ['tl', 'tr', 'bl', 'br'].forEach((corner) => {
      const w = el('div', `face-wedge face-wedge--${corner}`);
      stage.appendChild(w);
    });
  }

  tpl.fields.forEach((f) => stage.appendChild(fieldNode(tpl, f)));
}

/** Which corner a wedge-shaped slot curves away from, taken from where it sits. */
export function wedgeCorner(f) {
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2;
  return `${cy < 50 ? 't' : 'b'}${cx < 50 ? 'l' : 'r'}`;
}

function fieldNode(tpl, f) {
  const node = el('div', `slot slot--${f.type} slot--${f.size} shape-${f.shape} fill-${f.fill}`);
  node.dataset.id = f.id;
  node.dataset.align = f.align;
  node.dataset.label = f.label;
  node.title = `${f.label} (${fieldType(f.type).label})`;
  if (f.shape === 'wedge') node.dataset.corner = wedgeCorner(f);
  if (f.invert) node.classList.add('is-invert');
  if (f.id === state.selectedField) node.classList.add('is-selected');
  place(node, f);

  if (f.type === 'icon' || f.type === 'pip') {
    node.insertAdjacentHTML('beforeend', iconSvg(slotIcon(f, paint(tpl).variant), 'slot-icon'));
  } else if (f.type === 'art') {
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
  const tplChange = (key, value) => {
    commit((d) => {
      const live = d.templates.find((t) => t.id === tpl.id);
      if (live) live[key] = value;
    }, { history: historyGate(`tpl:${tpl.id}:${key}`), silent: true });
    if (key === 'name') renderTemplateList();
    renderFace(activeTemplate());
  };
  box.appendChild(buildForm([
    { key: 'name', label: 'Name', type: 'text', maxlength: 40 },
    {
      type: 'group', label: 'Face',
      fields: [
        { key: 'bg', label: 'Colour', type: 'color' },
        { key: 'ink', label: 'Ink', type: 'color' },
        { key: 'accent', label: 'Accent', type: 'color' },
      ],
    },
    { key: 'frame', label: 'Frame', type: 'select', options: CARD_FRAMES },
    { key: 'border', label: 'Keyline border', type: 'checkbox' },
    {
      type: 'group', label: 'Print run',
      fields: [
        { key: 'count', label: 'Copies', type: 'number', min: 1, max: 999 },
        { key: 'corner', label: 'Corner mm', type: 'number', min: 0, max: 20 },
      ],
    },
    { key: 'notes', label: 'Notes', type: 'textarea', rows: 2, placeholder: 'How this deck behaves' },
  ], tpl, tplChange));

  box.appendChild(variantEditor(tpl));

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

  const isGlyph = f.type === 'icon' || f.type === 'pip';
  box.appendChild(buildForm([
    { key: 'label', label: 'Label', type: 'text', maxlength: 30, hint: 'The engine uses this as the data key' },
    { key: 'type', label: 'Type', type: 'select', options: FIELD_TYPES },
    ...(isGlyph
      ? [{ key: 'icon', label: 'Glyph', type: 'select', options: iconOptions }]
      : [{ key: 'sample', label: 'Sample value', type: 'text', placeholder: fieldType(f.type).sample || 'shown in the preview' }]),
    {
      type: 'group', label: 'Plate',
      fields: [
        { key: 'shape', label: 'Shape', type: 'select', options: SLOT_SHAPES },
        { key: 'fill', label: 'Fill', type: 'select', options: SLOT_FILLS },
      ],
    },
    { key: 'invert', label: 'Ink on the plate, not the face', type: 'checkbox' },
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
        { key: 'size', label: 'Size', type: 'select', options: [{ id: 'sm', label: 'Small' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Large' }, { id: 'xl', label: 'Huge' }] },
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

const iconOptions = () =>
  ICON_GROUPS.flatMap((g) => ICONS.filter((i) => i.group === g)
    .map((i) => ({ id: i.id, label: `${g}: ${i.label}` })));

/** Colour variants: one template, a deck per colour. */
function variantEditor(tpl) {
  const wrap = el('div', 'variant-block');
  const head = el('div', 'variant-head');
  head.append(el('h2', 'inspector-title', 'Deck colours'));
  const add = el('button', 'btn btn--secondary btn--sm', 'Add');
  add.type = 'button';
  add.addEventListener('click', () => {
    commit((d) => {
      const live = d.templates.find((t) => t.id === tpl.id);
      if (live) live.variants.push(newVariant({ name: `Colour ${live.variants.length + 1}` }));
    });
    emit();
  });
  head.appendChild(add);
  wrap.appendChild(head);

  if (!tpl.variants.length) {
    wrap.appendChild(el('p', 'inspector-empty',
      'None yet. Add one per coloured deck and the slots stay shared, so a change to the layout reaches every colour at once.'));
    return wrap;
  }

  tpl.variants.forEach((v) => {
    const row = el('div', 'variant-row');
    const change = (key, value) => {
      commit((d) => {
        const live = d.templates.find((t) => t.id === tpl.id)?.variants.find((x) => x.id === v.id);
        if (live) live[key] = value;
      }, { history: historyGate(`var:${v.id}:${key}`), silent: true });
      renderFace(activeTemplate());
      renderVariantStrip(activeTemplate());
    };
    row.appendChild(buildForm([
      { key: 'name', label: 'Name', type: 'text', maxlength: 24 },
      {
        type: 'group', label: '',
        fields: [
          { key: 'bg', label: 'Colour', type: 'color' },
          { key: 'ink', label: 'Ink', type: 'color' },
        ],
      },
      { key: 'icon', label: 'Deck mark', type: 'select', options: iconOptions, blank: 'Use the slot glyph',
        hint: 'Fills every Pip slot on this deck' },
    ], v, change));
    const del = el('button', 'btn btn--ghost btn--sm', 'Remove');
    del.type = 'button';
    del.addEventListener('click', () => {
      commit((d) => {
        const live = d.templates.find((t) => t.id === tpl.id);
        if (live) live.variants = live.variants.filter((x) => x.id !== v.id);
      });
      if (state.selectedVariant === v.id) state.selectedVariant = null;
      emit();
    });
    row.appendChild(del);
    wrap.appendChild(row);
  });
  return wrap;
}

/** Swatches under the face, so a colour can be previewed without a form. */
function renderVariantStrip(tpl) {
  const bar = $('variantStrip');
  if (!bar) return;
  bar.textContent = '';
  if (!tpl || !tpl.variants.length) { bar.hidden = true; return; }
  bar.hidden = false;

  const swatch = (id, name, bg, ink) => {
    const b = el('button', 'swatch');
    b.type = 'button';
    b.title = name;
    b.setAttribute('aria-label', `Preview ${name}`);
    b.setAttribute('aria-pressed', String(state.selectedVariant === id));
    if (state.selectedVariant === id) b.classList.add('is-on');
    // `color` on the button feeds the dot through currentColor; the deck's
    // ink shows as the dot's inner ring so both halves of the pair are visible.
    b.style.color = bg;
    const dot = el('span', 'swatch-dot');
    dot.style.boxShadow = `inset 0 0 0 3px ${ink}`;
    b.appendChild(dot);
    b.appendChild(el('span', 'swatch-name', name));
    b.addEventListener('click', () => {
      state.selectedVariant = id;
      renderFace(activeTemplate());
      renderVariantStrip(activeTemplate());
    });
    return b;
  };

  bar.appendChild(swatch(null, 'Base', tpl.bg, tpl.ink));
  tpl.variants.forEach((v) => bar.appendChild(swatch(v.id, v.name, v.bg, v.ink)));
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
