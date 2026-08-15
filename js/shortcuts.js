// ── Shortcuts ────────────────────────────────────────────────
// Declared as data so the help sheet is generated rather than
// hand-maintained. A sheet written separately from the handlers is a
// sheet that goes stale the first time a binding changes, and then it is
// worse than none — the fleet's NeoKeys makes the same argument.

export const SHORTCUTS = [
  {
    group: 'Anywhere',
    keys: [
      { combo: ['1'], label: 'Board' },
      { combo: ['2'], label: 'Cards' },
      { combo: ['3'], label: 'Rules' },
      { combo: ['4'], label: 'Check' },
      { combo: ['5'], label: 'Export' },
      { combo: ['⌘', 'Z'], label: 'Undo, and a whole drag counts as one step' },
      { combo: ['?'], label: 'This sheet' },
      { combo: ['Esc'], label: 'Close a dialog' },
    ],
  },
  {
    group: 'With a zone selected',
    keys: [
      { combo: ['←', '→', '↑', '↓'], any: true, label: 'Nudge by 10 board units' },
      { combo: ['⇧', '←'], label: 'Nudge by 50, arrow of your choice' },
      { combo: ['⌘', 'D'], label: 'Duplicate' },
      { combo: ['Delete'], label: 'Remove, and any action pointing at it is cleared' },
    ],
  },
  {
    group: 'With a card slot selected',
    keys: [
      { combo: ['←', '→', '↑', '↓'], any: true, label: 'Nudge by 1% of the face' },
      { combo: ['⇧', '←'], label: 'Nudge by 5%, arrow of your choice' },
      { combo: ['Delete'], label: 'Remove the slot' },
    ],
  },
  {
    group: 'Pointer',
    keys: [
      { combo: ['Drag'], label: 'Move a zone or slot' },
      { combo: ['Drag an edge'], label: 'Resize from any of eight grips' },
      { combo: ['Click the board'], label: 'Clear the selection' },
    ],
  },
];

/** The mac glyphs read wrong on Windows and Linux. */
export function localiseCombo(combo) {
  const mac = navigator.platform.toUpperCase().includes('MAC')
    || navigator.userAgent.includes('Mac OS');
  return combo.map((k) => (k === '⌘' && !mac ? 'Ctrl' : k === '⇧' && !mac ? 'Shift' : k));
}
