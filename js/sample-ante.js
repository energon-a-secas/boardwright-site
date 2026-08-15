// ── Worked example: Elemental Ante ───────────────────────────
// A draft of the bet-your-life card game, encoded so the export is
// something an agent can build from. It is deliberately not finished:
// the readiness check has real questions to raise about it, which is
// what the second sample is for.
//
// Card look follows the Uno convention the design is aiming at: one flat
// face colour, a heavy oval, corner wedges carrying the two numbers a
// player reads across a table (actions spent, damage dealt).

const wedge = (id, label, corner, sample, size = 'md') => ({
  id,
  label,
  type: 'number',
  x: corner.includes('l') ? 2 : 76,
  y: corner.startsWith('t') ? 2 : 78,
  w: 24,
  h: 22,
  align: 'center',
  size,
  sample,
  shape: 'wedge',
  fill: 'ink',
  invert: true,
  icon: '',
});

export const SAMPLE_ANTE = {
  boardwright: 1,
  meta: {
    name: 'Elemental Ante',
    tagline: 'Bet your own life to swing harder, and hope the dice agree',
    minPlayers: 2,
    maxPlayers: 5,
    playtime: 40,
    notes: 'For kids and adults at the same table. Flat colour, one big glyph, two numbers per card, '
      + 'so a seven-year-old can read a card across the table without asking. The pieces are meant to be '
      + 'stand-ins: play it with LEGO, coins, anything on the shelf.',
  },
  board: {
    width: 1600,
    height: 1000,
    zones: [
      { id: 'z_life', name: 'Your Life Deck', kind: 'deck', x: 60, y: 60, w: 300, h: 210, owner: 'per-player', visibility: 'public', capacity: 25, accepts: ['t_life'], notes: 'Twenty-five cards in your element. This pile IS your health bar: cards leave it when you bet and when you are hit.' },
      { id: 'z_extra', name: 'Extra Life (White)', kind: 'supply', x: 390, y: 60, w: 260, h: 210, owner: 'shared', visibility: 'public', capacity: 125, accepts: ['t_life'], notes: 'Shared white reserve, 25 x 5. Drawn from on level up.' },
      { id: 'z_boss', name: 'Boss Life Deck', kind: 'deck', x: 680, y: 60, w: 320, h: 210, owner: 'shared', visibility: 'public', capacity: 125, accepts: ['t_life'], notes: 'Two bosses, black and white, 25 x 5 each. The black boss hits harder; the white one heals.' },
      { id: 'z_adv', name: 'Advantage Deck', kind: 'deck', x: 1030, y: 60, w: 260, h: 210, owner: 'shared', visibility: 'hidden', accepts: ['t_adv'], notes: 'Six cards. Shuffled once, never reshuffled.' },
      { id: 'z_class', name: 'Class Deck', kind: 'market', x: 1320, y: 60, w: 240, h: 210, owner: 'shared', visibility: 'public', capacity: 4, accepts: ['t_class'], notes: 'Four base classes laid face up at setup. Each player takes one.' },

      { id: 'z_ante', name: 'The Ante', kind: 'area', x: 480, y: 330, w: 640, h: 220, owner: 'shared', visibility: 'public', accepts: ['t_life'], notes: 'The middle of the table. Life cards you bet sit here until the attack resolves, so everyone can see the stake.' },
      { id: 'z_spent', name: 'Spent Pile', kind: 'discard', x: 1170, y: 330, w: 260, h: 220, owner: 'shared', visibility: 'public', accepts: ['t_life', 't_attack'], notes: '' },

      { id: 'z_hand', name: 'Your Hand', kind: 'hand', x: 60, y: 610, w: 620, h: 300, owner: 'per-player', visibility: 'owner', capacity: 7, accepts: ['t_attack', 't_adv'], notes: '' },
      { id: 'z_board', name: 'Your Class Board', kind: 'tableau', x: 720, y: 610, w: 520, h: 300, owner: 'per-player', visibility: 'public', capacity: 5, accepts: ['t_class', 't_skill'], notes: 'Your class card plus the skills unlocked so far.' },
      { id: 'z_level', name: 'Level Track', kind: 'track', x: 1290, y: 610, w: 250, h: 300, owner: 'per-player', visibility: 'public', accepts: ['c_marker'], notes: 'Five levels. Reaching one lets you draw a skill.' },
      { id: 'z_skills', name: 'Skill Deck', kind: 'deck', x: 60, y: 330, w: 380, h: 220, owner: 'shared', visibility: 'hidden', accepts: ['t_skill'], notes: 'Level-up rewards, drawn when your marker reaches a new level.' },
    ],
  },
  templates: [
    {
      id: 't_life',
      name: 'Life',
      w: 63, h: 88, corner: 4, count: 250,
      bg: '#e4483c', ink: '#ffffff', accent: '#15161c',
      frame: 'oval', border: true,
      notes: 'The workhorse. 25 per element deck, 25 x 5 white, 25 x 5 per boss. The big number is how much '
        + 'life the card is worth, and the cap on what you may bet with it.',
      // Each deck repaints the same slots and swaps the mark. Wind is the
      // one deck with dark ink, because a yellow face cannot carry white.
      variants: [
        { id: 'v_fire', name: 'Fire', bg: '#e4483c', ink: '#ffffff', icon: 'fire' },
        { id: 'v_water', name: 'Water', bg: '#2f7fd4', ink: '#ffffff', icon: 'water' },
        { id: 'v_earth', name: 'Earth', bg: '#4a9d3f', ink: '#ffffff', icon: 'earth' },
        { id: 'v_wind', name: 'Wind', bg: '#f0b429', ink: '#15161c', icon: 'wind' },
        { id: 'v_white', name: 'White reserve', bg: '#fbf8f2', ink: '#15161c', icon: 'heart' },
        { id: 'v_black', name: 'Boss black', bg: '#15161c', ink: '#ffffff', icon: 'crown' },
      ],
      fields: [
        { id: 'f_l_val', label: 'Value', type: 'number', x: 20, y: 32, w: 60, h: 36, align: 'center', size: 'xl', sample: '25', shape: 'none', fill: 'none', invert: false, icon: '' },
        { id: 'f_l_el', label: 'Element', type: 'pip', x: 4, y: 3, w: 20, h: 15, align: 'center', size: 'sm', sample: '', shape: 'circle', fill: 'ink', invert: true, icon: 'fire' },
        { id: 'f_l_el2', label: 'Element echo', type: 'pip', x: 76, y: 82, w: 20, h: 15, align: 'center', size: 'sm', sample: '', shape: 'circle', fill: 'ink', invert: true, icon: 'fire' },
      ],
    },
    {
      id: 't_attack',
      name: 'Attack',
      w: 63, h: 88, corner: 4, count: 3,
      bg: '#fbf8f2', ink: '#15161c', accent: '#7c3aed',
      frame: 'oval', border: true,
      notes: 'Three defaults, one per tier. Bottom-left is the action cost, bottom-right the damage. '
        + 'Basic is guaranteed; the other two are dice.',
      variants: [],
      fields: [
        { id: 'f_a_icon', label: 'Attack', type: 'icon', x: 24, y: 30, w: 52, h: 34, align: 'center', size: 'md', sample: '', shape: 'none', fill: 'none', invert: false, icon: 'fist' },
        wedge('f_a_cost', 'Actions', 'bl', '1'),
        wedge('f_a_dmg', 'Damage', 'br', '25'),
        { id: 'f_a_roll', label: 'Roll', type: 'text', x: 20, y: 68, w: 60, h: 8, align: 'center', size: 'sm', sample: 'guaranteed', shape: 'none', fill: 'none', invert: false, icon: '' },
      ],
    },
    {
      id: 't_class',
      name: 'Class',
      w: 63, h: 88, corner: 4, count: 4,
      bg: '#3c3a8f', ink: '#ffffff', accent: '#f0b429',
      frame: 'wedges', border: true,
      notes: 'Four base classes. Each changes one number: damage taken, damage dealt, actions, or the ante cap.',
      variants: [],
      fields: [
        { id: 'f_c_icon', label: 'Class', type: 'icon', x: 26, y: 26, w: 48, h: 32, align: 'center', size: 'md', sample: '', shape: 'none', fill: 'none', invert: false, icon: 'helm' },
        { id: 'f_c_name', label: 'Name', type: 'text', x: 14, y: 62, w: 72, h: 9, align: 'center', size: 'md', sample: 'Guardian', shape: 'none', fill: 'none', invert: false, icon: '' },
        { id: 'f_c_rule', label: 'Rule', type: 'paragraph', x: 14, y: 72, w: 72, h: 16, align: 'center', size: 'sm', sample: 'Take 5 less from every hit.', shape: 'none', fill: 'none', invert: false, icon: '' },
      ],
    },
    {
      id: 't_adv',
      name: 'Advantage',
      w: 63, h: 88, corner: 4, count: 6,
      bg: '#f0b429', ink: '#15161c', accent: '#e4483c',
      frame: 'none', border: true,
      notes: 'Six one-shot swings. Drawn rarely, so each should be worth a turn.',
      variants: [],
      fields: [
        { id: 'f_v_icon', label: 'Advantage', type: 'icon', x: 26, y: 24, w: 48, h: 32, align: 'center', size: 'md', sample: '', shape: 'none', fill: 'none', invert: false, icon: 'chest' },
        { id: 'f_v_name', label: 'Name', type: 'text', x: 14, y: 60, w: 72, h: 9, align: 'center', size: 'md', sample: 'Second Wind', shape: 'none', fill: 'none', invert: false, icon: '' },
        { id: 'f_v_rule', label: 'Rule', type: 'paragraph', x: 14, y: 70, w: 72, h: 18, align: 'center', size: 'sm', sample: 'Take back everything you bet this turn.', shape: 'none', fill: 'none', invert: false, icon: '' },
      ],
    },
    {
      id: 't_skill',
      name: 'Skill',
      w: 44, h: 67, corner: 3, count: 20,
      bg: '#2f7fd4', ink: '#ffffff', accent: '#f0b429',
      frame: 'oval', border: true,
      notes: 'Level-up rewards. Smaller than the rest so they read as a different thing in hand.',
      variants: [],
      fields: [
        { id: 'f_s_icon', label: 'Skill', type: 'icon', x: 28, y: 22, w: 44, h: 30, align: 'center', size: 'md', sample: '', shape: 'none', fill: 'none', invert: false, icon: 'spark' },
        { id: 'f_s_name', label: 'Name', type: 'text', x: 12, y: 56, w: 76, h: 10, align: 'center', size: 'sm', sample: 'Ember Shield', shape: 'none', fill: 'none', invert: false, icon: '' },
        wedge('f_s_lvl', 'Level', 'tl', '2', 'md'),
      ],
    },
  ],
  components: [
    { id: 'c_marker', name: 'Level marker', kind: 'marker', count: 1, perPlayer: true, notes: 'Anything on the shelf works: a LEGO brick, a coin, a bottle cap.' },
    { id: 'c_dice', name: 'Six-sided dice', kind: 'die', count: 3, perPlayer: false, notes: 'Shared. Three are needed for the all-in attack.' },
    { id: 'c_d20', name: 'Twenty-sided die', kind: 'die', count: 1, perPlayer: false, notes: 'Shared, for the special attack.' },
    { id: 'c_first', name: 'First player token', kind: 'marker', count: 1, perPlayer: false, notes: '' },
  ],
  phases: [
    { id: 'p_regen', name: 'Regenerate', notes: 'Take back the life cards you bet last turn that were not lost.' },
    { id: 'p_draw', name: 'Draw', notes: 'Refill your hand to three cards.' },
    { id: 'p_act', name: 'Act', notes: 'Spend up to three actions.' },
    { id: 'p_level', name: 'Level', notes: 'If you crossed a level this turn, draw a skill.' },
  ],
  actions: [
    { id: 'a_regen', name: 'Regenerate', phase: 'p_regen', from: 'z_ante', to: 'z_life', requires: 'Cards you bet last turn survived', effect: 'Return every surviving bet card to your life deck. This is why betting is a risk and not a cost.', limit: 'Once per turn' },
    { id: 'a_draw', name: 'Draw', phase: 'p_draw', from: 'z_adv', to: 'z_hand', requires: 'Fewer than 3 cards in hand', effect: 'Draw back up to three', limit: 'Once per turn' },
    { id: 'a_ante', name: 'Ante up', phase: 'p_act', from: 'z_life', to: 'z_ante', requires: 'The attack you are about to make, and its cap', effect: 'Move life cards into the ante. You may never bet more than the attack card allows.', limit: 'Once per attack' },
    { id: 'a_basic', name: 'Basic attack', phase: 'p_act', from: 'z_hand', to: 'z_spent', requires: '1 action, ante of 25', effect: 'Deal 25. No roll: it always lands.', limit: '3 per turn' },
    { id: 'a_special', name: 'Special attack', phase: 'p_act', from: 'z_hand', to: 'z_spent', requires: '2 actions, ante of 50, d20 of 15 or more', effect: 'Deal 50 on a hit. On a miss the ante is lost anyway.', limit: '1 per turn' },
    { id: 'a_allin', name: 'All in', phase: 'p_act', from: 'z_life', to: 'z_ante', requires: '2 actions, 3d6 totalling 10 or more', effect: 'Bet any amount of your life. On a hit, deal what you bet. On a miss, lose it.', limit: '1 per turn' },
    { id: 'a_hit', name: 'Take a hit', phase: 'p_act', from: 'z_life', to: 'z_spent', requires: 'An attack resolved against you', effect: 'Discard life cards equal to the damage', limit: '' },
    { id: 'a_boss', name: 'Boss turn', phase: 'p_act', from: 'z_boss', to: 'z_spent', requires: 'Every player has acted', effect: 'The boss attacks the player who dealt it the most damage', limit: 'Once per round' },
    { id: 'a_level', name: 'Level up', phase: 'p_level', from: 'z_skills', to: 'z_board', requires: 'Your marker crossed a level this turn', effect: 'Draw one skill and put it on your class board', limit: 'Once per turn' },
    { id: 'a_reserve', name: 'Claim reserve', phase: 'p_level', from: 'z_extra', to: 'z_life', requires: 'You reached level 3 or 5', effect: 'Take 25 white life into your deck, raising your ceiling', limit: 'Once per level' },
  ],
  win: [
    { id: 'w_boss', name: 'Boss down', kind: 'objective', trigger: 'The boss life deck is empty at the end of an attack', notes: 'Everyone still holding life cards wins together. The kids-and-adults table wants a co-op ending available.' },
    { id: 'w_last', name: 'Last standing', kind: 'elimination', trigger: 'Only one player still holds life cards, in the versus variant', notes: 'Use this instead of Boss down when playing without a boss.' },
  ],
};
