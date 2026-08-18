# CLAUDE.md: Boardwright

Boardwright: board game design handed to a coding agent. Free-form zones on a scaled stage (owner / visibility / capacity / what it holds), card templates whose slots are percentages of the face, and the half a picture cannot carry: components with counts, ordered phases, actions declared as a move between two zones, end conditions with their trigger. Cards carry a real look: face colour + ink + accent, oval/wedge frame, and per-slot plates (box/pill/circle/corner-wedge, invertible) so an Uno-style corner badge is an ordinary slot. **Colour variants** are the load-bearing idea. One template prints as many decks sharing every slot, and a `pip` slot takes its glyph from the deck while an `icon` slot keeps its own, which is how 4 element decks differ without becoming 4 templates that drift. js/icons.js holds 32 **original** glyphs (one path source feeding both inline SVG and canvas Path2D), deliberately not an imported set, since CC-BY/per-seat art would put an attribution burden inside every user's export. A readiness linter runs continuously over the model and its findings do **not** block the export. They ride inside it as open questions, which is the whole point: the agent asks instead of inventing a rule (it also flags a deck whose ink is under 3:1 on its own face, a defect that survives the screen and dies at the printer). Exports one in-browser zip (store-only writer in js/zip.js, no dependency): game.json, board.png, a design sheet per template carrying slot keys + a clean print face per deck colour, BRIEF.md, PROMPT.txt. Two samples: `sample-ante.js` (Elemental Ante, the coloured card game, first-run default) and `sample.js` (Harvest Run, plainer). localStorage + JSON import/export, no backend (boardwright.neorgon.com)

**Live:** boardwright.neorgon.com · **Port:** 8866

## Run

```bash
make serve
```

Then open http://localhost:8866. It must be served over HTTP. The app is ES modules, and `file://` blocks them.

## Architecture

| Module | Lines | Owns |
|---|---:|---|
| `js/cards.js` | 535 | `renderCards`, `paint`, `wedgeCorner`, `addTemplate`, `handleCardKey` |
| `js/board.js` | 383 | `renderBoard`, `select`, `removeZone`, `handleBoardKey`, `setBoardSize` |
| `js/image.js` | 315 | `drawBoard`, `drawCard`, `toBlob` |
| `js/export.js` | 294 | `buildJson`, `buildBrief`, `buildPrompt`, `buildBundle`, `download` |
| `js/model.js` | 264 | `MODEL_VERSION`, `BOARD_DEFAULT`, `ZONE_KINDS`, `COMPONENT_KINDS`, `OWNERS` |
| `js/rules.js` | 249 | `renderRules` |
| `js/lint.js` | 229 | `runChecks`, `countBlockers` |
| `js/report.js` | 220 | `renderCheck`, `renderExport`, `refreshFindings` |
| `js/forms.js` | 216 | `buildForm`, `el`, `panel`, `listRow` |
| `js/sample-ante.js` | 172 | `SAMPLE_ANTE` |
| `js/state.js` | 164 | `state`, `subscribe`, `subscribeQuiet`, `emit`, `commit` |
| `js/events.js` | 149 | `bindEvents` |
| `js/drag.js` | 128 | `attachRect`, `clamp`, `addHandles` |
| `js/zip.js` | 115 | `makeZip` |
| `js/icons.js` | 104 | `ICON_SIZE`, `ICON_STROKE`, `ICONS`, `ICON_GROUPS`, `iconById` |
| `js/modal.js` | 79 | `openModal`, `closeModal`, `openModalEl`, `handleModalKey`, `handleModalClick` |
| `js/navigate.js` | 72 | `goTo` |
| `js/sample.js` | 68 | `SAMPLE` |
| `js/utils.js` | 65 | `$`, `escHtml`, `showToast`, `debounce`, `confirmAction` |
| `js/shortcuts.js` | 54 | `SHORTCUTS`, `localiseCombo` |
| `js/render.js` | 49 | `VIEWS`, `render`, `setView` |
| `js/app.js` | 24 | none |

Vendored from `packages/neorgon-ui/`: never edit in place, run the sync script instead: `js/neorgon-footer.js`, `js/neorgon-header.js`.

## Data

- `localStorage['boardwright.design.v1']`

## Conventions

- Zero build step. Plain ES modules loaded by `js/app.js`.
- Header and footer come from the shared kits. Do not add site-local `.neo-footer` or `.header-bar` CSS.
- The fleet guideline is ~500 lines per module; `js/cards.js` is already past it. Split when touching it, do not grow it further.

## Gotchas

- **Colour variants are the load-bearing idea.** One template prints as many decks
  sharing every slot. A `pip` slot takes its glyph from the deck; an `icon` slot
  keeps its own. That is how four element decks differ without becoming four
  templates that drift. Splitting a variant into its own template reintroduces the
  drift the design exists to prevent.
- `js/icons.js` holds 32 **original** glyphs, one path source feeding both inline
  SVG and canvas `Path2D`. They are deliberately not an imported icon set,
  CC-BY or per-seat art would put an attribution burden inside every user's export.
- **The readiness linter's findings must not block export.** They ride inside the
  export as open questions, so the coding agent receiving it asks instead of
  inventing a rule. Making the linter blocking defeats the whole mechanism.
- The linter also flags a deck whose ink is under 3:1 on its own face. A defect
  that survives the screen and dies at the printer.

## Do not touch

- `js/neorgon-*.js` and `css/neorgon-*.css`: vendored kits, regenerated by `packages/neorgon-ui/sync-*.sh`.
