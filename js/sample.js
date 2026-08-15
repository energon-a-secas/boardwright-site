// ── Worked example ───────────────────────────────────────────
// A small, complete design used as the first-run state. It is not
// perfect on purpose: the first-player slot has no action touching it,
// so the readiness check has something real to say on the Check tab.

export const SAMPLE = {
  boardwright: 1,
  meta: {
    name: 'Harvest Run',
    tagline: 'Buy crops from a shared row and plant them before the field runs dry',
    minPlayers: 2,
    maxPlayers: 4,
    playtime: 45,
    notes: 'Warm and unhurried. Turns should be short enough that nobody reaches for a phone.',
  },
  board: {
    width: 1600,
    height: 1000,
    zones: [
      { id: 'z_deck', name: 'Field Deck', kind: 'deck', x: 60, y: 60, w: 240, h: 180, owner: 'shared', visibility: 'hidden', capacity: null, accepts: ['t_crop'], notes: 'Shuffled once at setup. It is never reshuffled: running out is the clock.' },
      { id: 'z_market', name: 'Market Row', kind: 'market', x: 330, y: 60, w: 780, h: 180, owner: 'shared', visibility: 'public', capacity: 5, accepts: ['t_crop'], notes: 'Always refilled to five before the active player acts.' },
      { id: 'z_compost', name: 'Compost', kind: 'discard', x: 1140, y: 60, w: 240, h: 180, owner: 'shared', visibility: 'public', capacity: null, accepts: ['t_crop'], notes: '' },
      { id: 'z_bank', name: 'Coin Bank', kind: 'supply', x: 1410, y: 60, w: 150, h: 180, owner: 'shared', visibility: 'public', capacity: null, accepts: ['c_coin'], notes: 'Unlimited in practice. If it empties, nobody earns.' },
      { id: 'z_track', name: 'Score Track', kind: 'track', x: 60, y: 280, w: 1500, h: 90, owner: 'shared', visibility: 'public', capacity: null, accepts: ['c_marker'], notes: 'Fifty spaces. Markers stack on ties.' },
      { id: 'z_hand', name: 'Player Hand', kind: 'hand', x: 60, y: 420, w: 700, h: 250, owner: 'per-player', visibility: 'owner', capacity: 7, accepts: ['t_crop'], notes: '' },
      { id: 'z_farm', name: 'Player Farm', kind: 'tableau', x: 800, y: 420, w: 760, h: 250, owner: 'per-player', visibility: 'public', capacity: 6, accepts: ['t_crop', 'c_coin'], notes: 'Six rows. A seventh crop cannot be planted, which is what makes the last turns tense.' },
      { id: 'z_first', name: 'First Player', kind: 'slot', x: 60, y: 710, w: 260, h: 160, owner: 'shared', visibility: 'public', capacity: 1, accepts: ['c_first'], notes: '' },
    ],
  },
  templates: [
    {
      id: 't_crop',
      name: 'Crop',
      w: 63, h: 88, corner: 3, count: 60,
      notes: 'One deck, four suits of fifteen.',
      fields: [
        { id: 'f_name', label: 'Name', type: 'text', x: 8, y: 6, w: 66, h: 9, align: 'left', size: 'md', sample: 'Winter Barley' },
        { id: 'f_cost', label: 'Cost', type: 'number', x: 78, y: 5, w: 14, h: 11, align: 'center', size: 'lg', sample: '3' },
        { id: 'f_art', label: 'Art', type: 'art', x: 8, y: 19, w: 84, h: 36, align: 'left', size: 'md', sample: '' },
        { id: 'f_type', label: 'Suit', type: 'badge', x: 8, y: 58, w: 38, h: 7, align: 'left', size: 'sm', sample: 'Grain' },
        { id: 'f_vp', label: 'Points', type: 'number', x: 74, y: 57, w: 18, h: 9, align: 'right', size: 'md', sample: '2' },
        { id: 'f_effect', label: 'Effect', type: 'paragraph', x: 8, y: 69, w: 84, h: 23, align: 'left', size: 'sm', sample: 'When planted, take one coin for each other Grain on your farm.' },
      ],
    },
  ],
  components: [
    { id: 'c_coin', name: 'Coin', kind: 'token', count: 50, perPlayer: false, notes: 'Denomination one. Change is made from the bank.' },
    { id: 'c_marker', name: 'Score marker', kind: 'marker', count: 1, perPlayer: true, notes: '' },
    { id: 'c_first', name: 'First player token', kind: 'marker', count: 1, perPlayer: false, notes: '' },
  ],
  phases: [
    { id: 'p_refill', name: 'Refill', notes: 'Top the market back up to five cards.' },
    { id: 'p_act', name: 'Actions', notes: 'The active player takes up to three actions.' },
    { id: 'p_clean', name: 'Cleanup', notes: 'Earn, score, then pass the first player token.' },
  ],
  actions: [
    { id: 'a_refill', name: 'Refill the market', phase: 'p_refill', from: 'z_deck', to: 'z_market', requires: 'The market holds fewer than five cards', effect: 'Deal from the field deck until the row holds five', limit: 'Once per turn' },
    { id: 'a_buy', name: 'Buy a crop', phase: 'p_act', from: 'z_market', to: 'z_hand', requires: 'Coins on your farm at least the card cost', effect: 'Pay the cost back to the bank', limit: '3 per turn' },
    { id: 'a_plant', name: 'Plant', phase: 'p_act', from: 'z_hand', to: 'z_farm', requires: 'A free row on your farm', effect: 'Resolve the crop effect immediately', limit: '3 per turn' },
    { id: 'a_earn', name: 'Earn', phase: 'p_clean', from: 'z_bank', to: 'z_farm', requires: '', effect: 'Take one coin for every two planted crops, rounded down', limit: 'Once per turn' },
    { id: 'a_compost', name: 'Compost', phase: 'p_clean', from: 'z_hand', to: 'z_compost', requires: 'More than seven cards in hand', effect: 'Discard down to seven', limit: 'As needed' },
    { id: 'a_score', name: 'Advance marker', phase: 'p_clean', from: '', to: 'z_track', requires: '', effect: 'Move your marker one space for each crop planted this turn', limit: 'Once per turn' },
  ],
  win: [
    { id: 'w_points', name: 'Best harvest', kind: 'score', trigger: 'The field deck cannot refill the market at the start of a turn', notes: 'Finish the round so every player has had the same number of turns. Ties go to the player holding fewer cards.' },
  ],
};
