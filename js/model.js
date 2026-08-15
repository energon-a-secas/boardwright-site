// ── Game model ───────────────────────────────────────────────
// The shape of a Boardwright design. Everything downstream (the
// linter, the brief, the images) reads this and nothing else, so a
// field that is not declared here cannot reach the export.

export const MODEL_VERSION = 1;

/** Board coordinate space. Zones are stored in these units, not pixels. */
export const BOARD_DEFAULT = { width: 1600, height: 1000 };

/**
 * Zone kinds. `source` marks a place components come from, `terminal` a
 * place they legitimately pile up in — the linter uses both to decide
 * whether a one-way zone is a mistake or the intent.
 */
export const ZONE_KINDS = [
  { id: 'area',    label: 'Area',    hue: 200, source: false, terminal: false, hint: 'Generic region of the board' },
  { id: 'deck',    label: 'Deck',    hue: 265, source: true,  terminal: false, hint: 'Face-down draw pile' },
  { id: 'market',  label: 'Market',  hue: 40,  source: true,  terminal: false, hint: 'Face-up row players buy from' },
  { id: 'hand',    label: 'Hand',    hue: 90,  source: false, terminal: false, hint: 'Held cards, visible to one player' },
  { id: 'tableau', label: 'Tableau', hue: 150, source: false, terminal: true,  hint: 'Cards played in front of a player' },
  { id: 'discard', label: 'Discard', hue: 0,   source: false, terminal: true,  hint: 'Where spent components go' },
  { id: 'supply',  label: 'Supply',  hue: 25,  source: true,  terminal: false, hint: 'Shared bank of tokens or resources' },
  { id: 'track',   label: 'Track',   hue: 180, source: false, terminal: true,  hint: 'Ordered spaces a marker moves along' },
  { id: 'slot',    label: 'Slot',    hue: 300, source: false, terminal: false, hint: 'Single placement space' },
  { id: 'score',   label: 'Score',   hue: 55,  source: false, terminal: true,  hint: 'Points readout or scoring pile' },
];

export const COMPONENT_KINDS = [
  { id: 'card',   label: 'Cards' },
  { id: 'token',  label: 'Tokens' },
  { id: 'meeple', label: 'Meeples' },
  { id: 'die',    label: 'Dice' },
  { id: 'tile',   label: 'Tiles' },
  { id: 'marker', label: 'Markers' },
  { id: 'board',  label: 'Boards' },
];

export const OWNERS = [
  { id: 'shared',        label: 'Shared' },
  { id: 'per-player',    label: 'One per player' },
  { id: 'active-player', label: 'Active player only' },
];

export const VISIBILITY = [
  { id: 'public', label: 'Public' },
  { id: 'owner',  label: 'Owner only' },
  { id: 'hidden', label: 'Hidden from all' },
];

export const FIELD_TYPES = [
  { id: 'text',      label: 'Text',      sample: 'Card name' },
  { id: 'paragraph', label: 'Paragraph', sample: 'Rules text goes here, two or three lines of it.' },
  { id: 'number',    label: 'Number',    sample: '3' },
  { id: 'art',       label: 'Art',       sample: '' },
  { id: 'icon',      label: 'Icon',      sample: '' },
  { id: 'badge',     label: 'Badge',     sample: 'Type' },
];

export const WIN_KINDS = [
  { id: 'score',       label: 'Highest score' },
  { id: 'race',        label: 'First to reach' },
  { id: 'objective',   label: 'Complete an objective' },
  { id: 'elimination', label: 'Last one standing' },
  { id: 'survival',    label: 'Survive the clock' },
];

/** Card sizes in mm. Poker is the default because most prototypes sleeve it. */
export const CARD_PRESETS = [
  { id: 'poker',  label: 'Poker 63x88',  w: 63,   h: 88 },
  { id: 'bridge', label: 'Bridge 57x89', w: 57,   h: 89 },
  { id: 'mini',   label: 'Mini 44x67',   w: 44,   h: 67 },
  { id: 'square', label: 'Square 70x70', w: 70,   h: 70 },
  { id: 'tarot',  label: 'Tarot 70x120', w: 70,   h: 120 },
  { id: 'jumbo',  label: 'Jumbo 89x127', w: 89,   h: 127 },
];

export const zoneKind = (id) => ZONE_KINDS.find((k) => k.id === id) || ZONE_KINDS[0];
export const fieldType = (id) => FIELD_TYPES.find((t) => t.id === id) || FIELD_TYPES[0];

let _seq = 0;
/** Readable, stable-ish ids. The brief prints these, so people read them. */
export function uid(prefix) {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36).slice(-4)}${_seq.toString(36)}`;
}

/** Slug used for the exported filenames and for engine-friendly keys. */
export function slug(str, fallback = 'untitled') {
  const s = String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || fallback;
}

export function newZone(partial = {}) {
  const kind = partial.kind || 'area';
  return {
    id: uid('zone'),
    name: partial.name || zoneKind(kind).label,
    kind,
    x: 40, y: 40, w: 360, h: 220,
    owner: kind === 'hand' || kind === 'tableau' ? 'per-player' : 'shared',
    visibility: kind === 'deck' ? 'hidden' : kind === 'hand' ? 'owner' : 'public',
    capacity: null,
    accepts: [],
    notes: '',
    ...partial,
  };
}

export function newComponent(partial = {}) {
  return { id: uid('cmp'), name: 'Component', kind: 'token', count: 20, perPlayer: false, notes: '', ...partial };
}

export function newField(partial = {}) {
  const type = partial.type || 'text';
  return {
    id: uid('fld'),
    label: fieldType(type).label,
    type,
    x: 8, y: 8, w: 84, h: 12,
    align: 'left',
    size: 'md',
    sample: fieldType(type).sample,
    ...partial,
  };
}

export function newTemplate(partial = {}) {
  return {
    id: uid('tpl'),
    name: 'Card',
    w: 63, h: 88,
    corner: 3,
    count: 40,
    notes: '',
    fields: [
      newField({ type: 'text', label: 'Name', x: 8, y: 6, w: 68, h: 9, sample: 'Card name' }),
      newField({ type: 'number', label: 'Cost', x: 78, y: 5, w: 14, h: 11, align: 'center', sample: '3' }),
      newField({ type: 'art', label: 'Art', x: 8, y: 18, w: 84, h: 38 }),
      newField({ type: 'badge', label: 'Type', x: 8, y: 58, w: 40, h: 7, sample: 'Type' }),
      newField({ type: 'paragraph', label: 'Effect', x: 8, y: 68, w: 84, h: 24, sample: 'What this card does when played.' }),
    ],
    ...partial,
  };
}

export function newPhase(partial = {}) {
  return { id: uid('ph'), name: 'Phase', notes: '', ...partial };
}

export function newAction(partial = {}) {
  return { id: uid('act'), name: 'Action', phase: '', from: '', to: '', requires: '', effect: '', limit: '', ...partial };
}

export function newWin(partial = {}) {
  return { id: uid('win'), name: 'Win condition', kind: 'score', trigger: '', notes: '', ...partial };
}

export function blankDesign() {
  return {
    boardwright: MODEL_VERSION,
    meta: {
      name: 'Untitled game',
      tagline: '',
      minPlayers: 2,
      maxPlayers: 4,
      playtime: 45,
      notes: '',
    },
    board: { ...BOARD_DEFAULT, zones: [] },
    templates: [],
    components: [],
    phases: [],
    actions: [],
    win: [],
  };
}

/**
 * Fill in whatever an imported file is missing. Import is the one place a
 * design can arrive hand-edited or from an older version, so every consumer
 * downstream is allowed to assume the shape is complete.
 */
export function migrate(raw) {
  const d = blankDesign();
  if (!raw || typeof raw !== 'object') return d;
  d.boardwright = MODEL_VERSION;
  Object.assign(d.meta, raw.meta || {});
  const board = raw.board || {};
  d.board.width = Number(board.width) || BOARD_DEFAULT.width;
  d.board.height = Number(board.height) || BOARD_DEFAULT.height;
  d.board.zones = (board.zones || []).map((z) => newZone({ ...z, id: z.id || uid('zone') }));
  d.templates = (raw.templates || []).map((t) => ({
    ...newTemplate({ ...t, id: t.id || uid('tpl'), fields: [] }),
    fields: (t.fields || []).map((f) => newField({ ...f, id: f.id || uid('fld') })),
  }));
  d.components = (raw.components || []).map((c) => newComponent({ ...c, id: c.id || uid('cmp') }));
  d.phases = (raw.phases || []).map((p) => newPhase({ ...p, id: p.id || uid('ph') }));
  d.actions = (raw.actions || []).map((a) => newAction({ ...a, id: a.id || uid('act') }));
  d.win = (raw.win || []).map((w) => newWin({ ...w, id: w.id || uid('win') }));
  return d;
}
