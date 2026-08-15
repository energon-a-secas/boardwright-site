// ── Check + Export views ─────────────────────────────────────
// Two read-only panes over the same design: what is still open, and
// what leaves the building.

import { state, replaceDesign } from './state.js';
import { runChecks, countBlockers, BLOCKER } from './lint.js';
import { el, panel } from './forms.js';
import { buildBrief, buildJson, buildPrompt, buildBundle, download, textBlob } from './export.js';
import { slug } from './model.js';
import { SAMPLE } from './sample.js';
import { SAMPLE_ANTE } from './sample-ante.js';
import { goTo } from './navigate.js';
import { $, showToast, confirmAction } from './utils.js';

/* ── Check ────────────────────────────────────────────────── */

export function renderCheck() {
  const pane = $('checkPane');
  pane.textContent = '';
  const findings = state.findings;
  const blockers = countBlockers(findings);

  const head = el('section', 'verdict');
  if (!findings.length) {
    head.classList.add('verdict--clear');
    head.append(
      el('h2', 'verdict-title', 'Nothing left open'),
      el('p', 'verdict-line', 'Every zone connects to an action, every action moves something, and the game can end. The export will not carry any questions.'),
    );
  } else {
    head.classList.add(blockers ? 'verdict--blocked' : 'verdict--warn');
    head.append(
      el('h2', 'verdict-title', blockers
        ? `${blockers} ${blockers === 1 ? 'gap blocks' : 'gaps block'} a build`
        : `${findings.length} ${findings.length === 1 ? 'thing' : 'things'} worth confirming`),
      el('p', 'verdict-line',
        'You can export either way. Everything below travels with the bundle as an open question, so whoever builds this asks instead of guessing.'),
    );
  }
  pane.appendChild(head);

  if (!findings.length) return;

  const groups = [
    { level: BLOCKER, title: 'Blocking', hint: 'An engine cannot be generated past these without inventing rules. Click one to go to it.' },
    { level: 'check', title: 'Worth confirming', hint: 'Legal designs, but each one is a choice somebody should make on purpose. Click one to go to it.' },
  ];

  groups.forEach((g) => {
    const items = findings.filter((f) => f.level === g.level);
    if (!items.length) return;
    const p = panel(`${g.title} (${items.length})`, { hint: g.hint });
    items.forEach((f) => {
      const card = el(f.target ? 'button' : 'article', `finding finding--${f.level}`);
      if (f.target) {
        card.type = 'button';
        card.classList.add('finding--go');
        card.addEventListener('click', () => goTo(f.target));
      }
      const top = el('div', 'finding-top');
      top.append(el('span', 'finding-where', f.where), el('h3', 'finding-title', f.title));
      if (f.target) top.appendChild(el('span', 'finding-go', 'Take me there'));
      card.append(top, el('p', 'finding-detail', f.detail));
      card.appendChild(el('p', 'finding-q', f.question));
      p.body.appendChild(card);
    });
    pane.appendChild(p);
  });
}

/* ── Export ───────────────────────────────────────────────── */

export function renderExport() {
  const pane = $('exportPane');
  pane.textContent = '';
  const d = state.design;
  const findings = state.findings;

  const bundle = panel('The bundle', {
    hint: 'One archive holding the model, the reference renders, the brief, and a prompt to open with. Hand the whole thing to an agent.',
  });

  const manifest = el('ul', 'manifest');
  manifest.append(
    manifestRow('game.json', 'The model. Zones, components, phases, actions, end conditions.'),
    manifestRow('board.png', `Board reference at ${d.board.width}x${d.board.height}, every zone labelled with its id.`),
    ...d.templates.flatMap((t) => {
      const base = slug(t.name, t.id);
      const rows = [manifestRow(`cards/${base}-design.png`, `Design sheet for ${t.name}, slots labelled with their key.`)];
      if (t.variants.length) {
        rows.push(manifestRow(`cards/${base}-*.png`,
          `Print faces, one per deck colour: ${t.variants.map((v) => v.name).join(', ')}.`));
      } else {
        rows.push(manifestRow(`cards/${base}-face.png`, `Print face for ${t.name}, no annotations.`));
      }
      return rows;
    }),
    manifestRow('BRIEF.md', findings.length
      ? `The same model in prose, ending with ${findings.length} open ${findings.length === 1 ? 'question' : 'questions'}.`
      : 'The same model in prose. Nothing was left open.'),
    manifestRow('PROMPT.txt', 'The message to send with it.'),
  );
  bundle.body.appendChild(manifest);

  const dl = el('div', 'toolbar toolbar--gap');
  const zipBtn = el('button', 'btn btn--primary', 'Download bundle');
  zipBtn.type = 'button';
  zipBtn.addEventListener('click', async () => {
    zipBtn.disabled = true;
    zipBtn.textContent = 'Packing…';
    try {
      const out = await buildBundle(state.design);
      download(out.blob, out.name);
      showToast(`${out.name} · ${fmtSize(out.blob.size)}`);
    } catch (err) {
      showToast('Could not build the bundle');
      console.error(err);
    } finally {
      zipBtn.disabled = false;
      zipBtn.textContent = 'Download bundle';
    }
  });
  dl.appendChild(zipBtn);
  dl.appendChild(action('Copy prompt', async () => {
    await copy(buildPrompt(state.design));
    showToast('Prompt copied');
  }));
  dl.appendChild(action('game.json', () => {
    download(textBlob(buildJson(state.design), 'application/json'), `${slug(d.meta.name, 'game')}.json`);
  }));
  dl.appendChild(action('BRIEF.md', () => {
    download(textBlob(buildBrief(state.design, findings), 'text/markdown'), 'BRIEF.md');
  }));
  bundle.body.appendChild(dl);
  pane.appendChild(bundle);

  const preview = panel('Brief preview', { hint: 'What the agent reads. The full text ships in the bundle.' });
  const pre = el('pre', 'brief-preview');
  pre.textContent = buildBrief(state.design, findings);
  preview.body.appendChild(pre);
  pane.appendChild(preview);

  const manage = panel('This design', {
    hint: 'Everything lives in this browser. Export the JSON to move it or keep a version. '
      + 'Two examples ship with the tool: Elemental Ante is a coloured card game, Harvest Run a plainer board game.',
  });
  const row = el('div', 'toolbar toolbar--gap');
  row.append(
    action('Import JSON', () => $('importFile').click()),
    action('Load Elemental Ante', () => {
      confirmAction('Load Elemental Ante?', 'The card-game example replaces what is on screen. Undo brings it back.', () => {
        replaceDesign(structuredClone(SAMPLE_ANTE));
        showToast('Elemental Ante loaded');
      });
    }),
    action('Load Harvest Run', () => {
      confirmAction('Load Harvest Run?', 'The board-game example replaces what is on screen. Undo brings it back.', () => {
        replaceDesign(structuredClone(SAMPLE));
        showToast('Harvest Run loaded');
      });
    }),
    action('Start blank', () => {
      confirmAction('Clear this design?', 'Every zone, card and rule goes. Undo brings it back.', () => {
        replaceDesign(null);
        showToast('Cleared');
      });
    }, 'btn--danger'),
  );
  manage.body.appendChild(row);
  pane.appendChild(manage);
}

function manifestRow(name, what) {
  const li = el('li', 'manifest-row');
  li.append(el('code', 'manifest-name', name), el('span', 'manifest-what', what));
  return li;
}

function action(label, onClick, variant = 'btn--secondary') {
  const b = el('button', `btn ${variant}`, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

const fmtSize = (n) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard access is refused on insecure origins and in some
    // embedded webviews; the textarea route still works there.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

/** Recompute findings. Called on every mutation through the quiet channel. */
export function refreshFindings() {
  state.findings = runChecks(state.design);
  const badge = $('checkCount');
  const n = state.findings.length;
  const blockers = countBlockers(state.findings);
  badge.textContent = String(n);
  badge.hidden = n === 0;
  badge.classList.toggle('tab-count--blocked', blockers > 0);

  // The recompute is debounced, so a pane rendered before it finished is
  // showing the previous answer. Only the Check pane reads findings directly,
  // and redrawing it holds no focus, so it is safe to redraw in place.
  if (state.view === 'check') renderCheck();
}
