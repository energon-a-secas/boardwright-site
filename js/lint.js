// ── Readiness check ──────────────────────────────────────────
// Not a validator: a design is allowed to be incomplete. These are the
// questions an implementer would have to ask, found ahead of time. They
// never block the export — they ride along inside it, so the agent
// building the game knows what was left open instead of inventing it.

import { zoneKind } from './model.js';
import { iconById } from './icons.js';

const BLOCKER = 'blocker';
const CHECK = 'check';

/**
 * @param {object} d design
 * @returns {{level: string, where: string, title: string, detail: string, question: string}[]}
 */
export function runChecks(d) {
  const out = [];
  /**
   * @param {object} [target] where the problem lives, so a reader can be taken
   *   to it. A finding nobody can locate is a finding nobody fixes.
   */
  const add = (level, where, title, detail, question, target = null) =>
    out.push({ level, where, title, detail, question, target });

  const zones = d.board.zones;
  const byId = new Map(zones.map((z) => [z.id, z]));
  const froms = new Set(d.actions.map((a) => a.from).filter(Boolean));
  const tos = new Set(d.actions.map((a) => a.to).filter(Boolean));
  const accepted = new Set(zones.flatMap((z) => z.accepts));

  /* ── The three things nothing works without ── */

  if (!zones.length) {
    add(BLOCKER, 'Board', 'The board has no zones',
      'Every component needs somewhere to be. Zones are the containers the engine models.',
      'Where do components live on this board?', { view: 'board' });
  }
  if (!d.actions.length) {
    add(BLOCKER, 'Rules', 'No actions are defined',
      'Without actions the export describes a layout nobody can touch, and the engine has no verbs.',
      'What may a player actually do on their turn?', { view: 'rules', anchor: 'actions' });
  }
  if (!d.win.length) {
    add(BLOCKER, 'Rules', 'The game cannot end',
      'No end condition is defined, so the engine has nothing to evaluate after a turn.',
      'How does this game end, and who wins?', { view: 'rules', anchor: 'win' });
  }

  /* ── Overview ── */

  if (!d.meta.name || d.meta.name === 'Untitled game') {
    add(CHECK, 'Rules', 'The game has no name',
      'The name is the title of every exported file and the header of the brief.',
      'What is this game called?', { view: 'rules', anchor: 'overview' });
  }
  if (d.meta.minPlayers > d.meta.maxPlayers) {
    add(BLOCKER, 'Rules', 'Player count is inverted',
      `Minimum ${d.meta.minPlayers} is above the maximum ${d.meta.maxPlayers}, so no table size is legal.`,
      'What is the real player range?', { view: 'rules', anchor: 'overview' });
  }

  /* ── Zones ── */

  const seen = new Map();
  zones.forEach((z) => {
    const key = z.name.trim().toLowerCase();
    if (seen.has(key)) {
      add(CHECK, 'Board', `Two zones are both called "${z.name}"`,
        'The brief refers to zones by name, so a duplicate makes the actions ambiguous to read.',
        `Which "${z.name}" does each action mean?`, { view: 'board', zone: z.id });
    }
    seen.set(key, z.id);

    const kind = zoneKind(z.kind);
    const isFrom = froms.has(z.id);
    const isTo = tos.has(z.id);

    if (!isFrom && !isTo) {
      add(CHECK, 'Board', `Nothing moves in or out of "${z.name}"`,
        'No action names this zone as a source or a destination, so the engine would build it and never touch it.',
        `What puts components into "${z.name}", and what takes them out?`, { view: 'board', zone: z.id });
    } else if (isTo && !isFrom && !kind.terminal) {
      add(CHECK, 'Board', `"${z.name}" fills up and never empties`,
        `Components arrive but no action ever draws from it, and a ${kind.label.toLowerCase()} is not normally a final resting place.`,
        `Do components ever leave "${z.name}"?`, { view: 'board', zone: z.id });
    }

    if (kind.source && !isFrom) {
      add(CHECK, 'Board', `Nothing is ever drawn from "${z.name}"`,
        `A ${kind.label.toLowerCase()} exists to supply the table, but no action uses it as a source.`,
        `Which action draws from "${z.name}"?`, { view: 'board', zone: z.id });
    }
    if (kind.id === 'deck' && !z.accepts.length) {
      add(CHECK, 'Board', `"${z.name}" does not say what is in it`,
        'A deck with no card template or component assigned leaves the engine nothing to shuffle.',
        `What cards make up "${z.name}"?`, { view: 'board', zone: z.id });
    }
    if (z.capacity === 0) {
      add(CHECK, 'Board', `"${z.name}" has a capacity of zero`,
        'Nothing can ever be placed there. Leave capacity empty for unlimited.',
        `What is the real limit on "${z.name}"?`, { view: 'board', zone: z.id });
    }
    if (z.kind === 'hand' && z.owner === 'shared') {
      add(CHECK, 'Board', `"${z.name}" is a shared hand`,
        'Hands are usually per-player. A shared one is a real design choice, and the engine models it very differently.',
        `Is "${z.name}" genuinely shared by every player?`, { view: 'board', zone: z.id });
    }
  });

  /* ── Actions and phases ── */

  d.actions.forEach((a) => {
    const label = a.name || 'An unnamed action';
    if (!a.from && !a.to) {
      add(BLOCKER, 'Rules', `"${label}" moves nothing`,
        'Neither a source nor a destination zone is set, so there is no state change for the engine to apply.',
        `What does "${label}" move, and from where to where?`, { view: 'rules', entry: a.id });
    }
    if (a.from && !byId.has(a.from)) {
      add(BLOCKER, 'Rules', `"${label}" draws from a zone that no longer exists`,
        'The source zone was deleted after this action was written.',
        `Which zone should "${label}" draw from now?`, { view: 'rules', entry: a.id });
    }
    if (a.to && !byId.has(a.to)) {
      add(BLOCKER, 'Rules', `"${label}" sends components to a zone that no longer exists`,
        'The destination zone was deleted after this action was written.',
        `Where should "${label}" send components now?`, { view: 'rules', entry: a.id });
    }
    if (d.phases.length && !a.phase) {
      add(CHECK, 'Rules', `"${label}" is not tied to a phase`,
        'With phases defined but this action loose, the engine cannot tell when it is legal.',
        `In which phase may a player take "${label}"?`, { view: 'rules', entry: a.id });
    }
    if (!a.effect && !a.requires) {
      add(CHECK, 'Rules', `"${label}" has no cost and no effect`,
        'A move with neither is either free and unconditional, or underspecified.',
        `Is "${label}" really free, or does it cost something?`, { view: 'rules', entry: a.id });
    }
  });

  d.phases.forEach((ph) => {
    if (!d.actions.some((a) => a.phase === ph.id)) {
      add(CHECK, 'Rules', `Nothing happens in "${ph.name}"`,
        'No action is assigned to this phase, so the engine would step through it as a no-op.',
        `What happens during "${ph.name}"?`, { view: 'rules', entry: ph.id });
    }
  });

  d.win.forEach((w) => {
    if (!w.trigger) {
      add(BLOCKER, 'Rules', `"${w.name}" never gets checked`,
        'The condition has no trigger, so the engine does not know when to evaluate it.',
        `When is "${w.name}" checked?`, { view: 'rules', entry: w.id });
    }
  });

  /* ── Components and cards ── */

  d.components.forEach((c) => {
    if (!accepted.has(c.id)) {
      add(CHECK, 'Rules', `"${c.name}" has nowhere to go`,
        'No zone lists this component, so it is in the box but never on the table.',
        `Which zone holds "${c.name}"?`, { view: 'rules', entry: c.id });
    }
  });

  d.templates.forEach((t) => {
    if (!accepted.has(t.id)) {
      add(CHECK, 'Cards', `"${t.name}" cards have nowhere to go`,
        'No zone accepts this template, so the engine has a card format and no pile to put it in.',
        `Which zone holds the "${t.name}" cards?`, { view: 'cards', template: t.id });
    }
    if (!t.fields.length) {
      add(CHECK, 'Cards', `"${t.name}" has no slots`,
        'A card format with no fields carries no data, so the engine has nothing to render or read.',
        `What is printed on a "${t.name}" card?`, { view: 'cards', template: t.id });
    }
    // A deck printed in a colour its own ink cannot be read on is a real
    // production defect: it survives the screen and dies at the printer.
    const paints = [{ name: 'Base', bg: t.bg, ink: t.ink }, ...t.variants];
    paints.forEach((p) => {
      const ratio = contrast(p.bg, p.ink);
      if (ratio !== null && ratio < 3) {
        add(CHECK, 'Cards', `"${t.name}" is hard to read in ${p.name}`,
          `Ink ${p.ink} on ${p.bg} is about ${ratio.toFixed(1)}:1. Under 3:1 the numbers stop reading across a table, and printing loses more contrast than a screen shows.`,
          `Should ${p.name} use a darker ink or a lighter face?`, { view: 'cards', template: t.id });
      }
    });

    t.fields.forEach((f) => {
      if ((f.type === 'icon' || f.type === 'pip') && !iconById(f.icon)) {
        add(BLOCKER, 'Cards', `"${f.label}" points at a glyph that does not exist`,
          `The slot asks for \`${f.icon || '(empty)'}\`, which is not in the icon set, so it renders as an empty box.`,
          `Which glyph should "${f.label}" use?`, { view: 'cards', template: t.id, field: f.id });
      }
      if (f.x + f.w > 100.5 || f.y + f.h > 100.5) {
        add(CHECK, 'Cards', `"${f.label}" runs off the "${t.name}" face`,
          `It sits at ${f.x}%, ${f.y}% and is ${f.w}% by ${f.h}%, which crosses the card edge.`,
          `Should "${f.label}" bleed off the edge, or move inside it?`, { view: 'cards', template: t.id, field: f.id });
      }
    });
  });

  return out;
}

/** WCAG relative-luminance ratio between two hex colours, or null if unparseable. */
function contrast(a, b) {
  const lum = (hex) => {
    const s = String(hex).replace('#', '');
    const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
    if (!/^[0-9a-f]{6}$/i.test(full)) return null;
    const n = parseInt(full, 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const l1 = lum(a);
  const l2 = lum(b);
  if (l1 === null || l2 === null) return null;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export const countBlockers = (findings) => findings.filter((f) => f.level === BLOCKER).length;
export { BLOCKER, CHECK };
