// ── Entry point ──────────────────────────────────────────────

import { state, loadSaved, replaceDesign } from './state.js';
import { render, VIEWS } from './render.js';
import { bindEvents } from './events.js';
import { refreshFindings } from './report.js';
import { SAMPLE } from './sample.js';

function init() {
  // A first visitor gets the worked example rather than an empty grid:
  // the point of the tool is hard to see from a blank board.
  if (!loadSaved()) replaceDesign(structuredClone(SAMPLE));

  const hash = location.hash.slice(1);
  if (VIEWS.includes(hash)) state.view = hash;

  bindEvents();
  refreshFindings();
  render();
}

init();
