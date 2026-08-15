// ── Declarative forms ────────────────────────────────────────
// Every editor in the app (zone inspector, card slot, component,
// phase, action, win condition) is the same three things: a schema, an
// object, a change callback. Writing that once is what keeps each
// editor module small.

/**
 * @typedef {object} FieldSpec
 * @property {string} [key]      property on the target object
 * @property {string} label
 * @property {'text'|'textarea'|'number'|'select'|'checkbox'|'chips'|'group'} type
 * @property {Array|Function} [options]  for select/chips: {id,label}[] or a getter
 * @property {FieldSpec[]} [fields]      for type 'group'
 * @property {boolean} [nullable]        number: empty input means null, not 0
 * @property {string} [hint]
 */

const resolve = (opts) => (typeof opts === 'function' ? opts() : opts || []);

/**
 * @param {FieldSpec[]} schema
 * @param {object} obj
 * @param {(key: string, value: any) => void} onChange
 * @returns {DocumentFragment}
 */
export function buildForm(schema, obj, onChange) {
  const frag = document.createDocumentFragment();
  schema.forEach((spec) => frag.appendChild(buildField(spec, obj, onChange)));
  return frag;
}

function buildField(spec, obj, onChange) {
  if (spec.type === 'group') {
    const wrap = el('div', 'form-group');
    if (spec.label) wrap.appendChild(el('span', 'form-group-label', spec.label));
    const row = el('div', 'form-row');
    spec.fields.forEach((f) => row.appendChild(buildField(f, obj, onChange)));
    wrap.appendChild(row);
    return wrap;
  }

  const wrap = el('label', 'form-field');
  if (spec.type === 'checkbox') wrap.classList.add('form-field--inline');
  const id = `f_${spec.key}_${Math.random().toString(36).slice(2, 7)}`;
  const label = el('span', 'form-label', spec.label);
  const input = makeInput(spec, obj, onChange, id);
  input.id = id;

  if (spec.type === 'checkbox') {
    wrap.append(input, label);
  } else {
    wrap.append(label, input);
  }
  if (spec.hint) wrap.appendChild(el('span', 'form-hint', spec.hint));
  return wrap;
}

function makeInput(spec, obj, onChange, id) {
  const value = obj[spec.key];

  switch (spec.type) {
    case 'textarea': {
      const ta = el('textarea', 'form-input');
      ta.rows = spec.rows || 3;
      ta.value = value ?? '';
      if (spec.placeholder) ta.placeholder = spec.placeholder;
      ta.addEventListener('input', () => onChange(spec.key, ta.value));
      return ta;
    }

    case 'number': {
      const inp = el('input', 'form-input');
      inp.type = 'number';
      inp.value = value === null || value === undefined ? '' : value;
      if (spec.min !== undefined) inp.min = spec.min;
      if (spec.max !== undefined) inp.max = spec.max;
      if (spec.step !== undefined) inp.step = spec.step;
      if (spec.placeholder) inp.placeholder = spec.placeholder;
      inp.addEventListener('input', () => {
        if (inp.value === '') return onChange(spec.key, spec.nullable ? null : 0);
        onChange(spec.key, clampNum(Number(inp.value), spec));
      });
      return inp;
    }

    case 'select': {
      const sel = el('select', 'form-input');
      if (spec.blank) sel.appendChild(new Option(spec.blank, ''));
      resolve(spec.options).forEach((o) => sel.appendChild(new Option(o.label, o.id)));
      sel.value = value ?? '';
      sel.addEventListener('change', () => onChange(spec.key, sel.value));
      return sel;
    }

    case 'checkbox': {
      const inp = el('input', 'form-check');
      inp.type = 'checkbox';
      inp.checked = Boolean(value);
      inp.addEventListener('change', () => onChange(spec.key, inp.checked));
      return inp;
    }

    case 'chips': {
      const box = el('div', 'chips');
      const selected = Array.isArray(value) ? value : [];
      const opts = resolve(spec.options);
      if (!opts.length) {
        box.appendChild(el('span', 'form-hint', spec.empty || 'Nothing to pick yet'));
        return box;
      }
      opts.forEach((o) => {
        const btn = el('button', 'chip', o.label);
        btn.type = 'button';
        const on = selected.includes(o.id);
        btn.setAttribute('aria-pressed', String(on));
        if (on) btn.classList.add('is-on');
        btn.addEventListener('click', () => {
          const next = selected.includes(o.id)
            ? selected.filter((v) => v !== o.id)
            : [...selected, o.id];
          onChange(spec.key, next);
        });
        box.appendChild(btn);
      });
      return box;
    }

    default: {
      const inp = el('input', 'form-input');
      inp.type = 'text';
      inp.value = value ?? '';
      if (spec.placeholder) inp.placeholder = spec.placeholder;
      if (spec.maxlength) inp.maxLength = spec.maxlength;
      inp.addEventListener('input', () => onChange(spec.key, inp.value));
      return inp;
    }
  }
}

function clampNum(n, spec) {
  if (Number.isNaN(n)) return spec.min ?? 0;
  if (spec.min !== undefined && n < spec.min) return spec.min;
  if (spec.max !== undefined && n > spec.max) return spec.max;
  return n;
}

/** Tiny element helper — used across the render modules. */
export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A titled block with an optional action button in its header. */
export function panel(title, { action, onAction, hint } = {}) {
  const sec = el('section', 'panel');
  const head = el('div', 'panel-head');
  head.appendChild(el('h2', 'panel-title', title));
  if (action) {
    const btn = el('button', 'btn btn--secondary btn--sm', action);
    btn.type = 'button';
    btn.addEventListener('click', onAction);
    head.appendChild(btn);
  }
  sec.appendChild(head);
  if (hint) sec.appendChild(el('p', 'panel-hint', hint));
  const body = el('div', 'panel-body');
  sec.appendChild(body);
  sec.body = body;
  return sec;
}

/** Row of a repeatable list, with a delete button wired to `onDelete`. */
export function listRow(onDelete, label = 'Remove') {
  const row = el('div', 'list-row');
  const del = el('button', 'btn btn--ghost btn--icon icon-del', '');
  del.type = 'button';
  del.title = label;
  del.setAttribute('aria-label', label);
  del.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
  del.addEventListener('click', onDelete);
  row.appendChild(del);
  return row;
}
