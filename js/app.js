// ── Entry point ──────────────────────────────────────────────

import { state, loadSaved, replaceDesign } from './state.js';
import { render, VIEWS } from './render.js';
import { bindEvents } from './events.js';
import { refreshFindings } from './report.js';
import { SAMPLE_ANTE } from './sample-ante.js';

function init() {
  // A first visitor gets a worked example rather than an empty grid: the
  // point of the tool is hard to see from a blank board. Elemental Ante is
  // the one that shows every part, card styling included.
  if (!loadSaved()) replaceDesign(structuredClone(SAMPLE_ANTE));

  const hash = location.hash.slice(1);
  if (VIEWS.includes(hash)) state.view = hash;

  bindEvents();
  refreshFindings();
  render();
}

init();
