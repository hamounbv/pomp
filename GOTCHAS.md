# Gotchas

A running log of things that cost time on this project. Agents read it at
the start of every session and add to it when they hit something new (see
the Session protocol in `AGENTS.md`). Never delete an entry — update its
`Status` instead.

Entries tagged `Scope: template-candidate` are harvested across all client
repos to improve `brandvm/wf-template`.

## Entry format

```md
### YYYY-MM-DD · Short title
- Area: designer | css | loader | release | mcp | ci | js | perf
- Scope: project | template-candidate
- Symptom: what was observed
- Cause: why it happened
- Fix: what was done, or the workaround
- Status: open | fixed <sha> | upstreamed wf-template <sha>
- Found by: claude | codex | human
```

## This project

<!-- Add new entries here, newest first. -->

### 2026-08-21 · Homepage went black when the hero video failed
- Area: css
- Scope: template-candidate
- Symptom: Full-viewport black hero while the video loads or if it fails to
  decode.
- Cause: The video, its wrapper and the section are transparent, so only a
  black gradient painted the area.
- Fix: `css/pomp.css` §09 paints `--brand-ground` behind the hero;
  `js/pomp.js` §5 retries a blocked autoplay once and marks the wrapper
  `data-hero-video="failed"` after 6 s. Hero videos ship with a `poster`.
- Status: fixed 682fd0f
- Found by: human

### 2026-08-21 · Page loader had no exit except a Webflow interaction
- Area: css
- Scope: template-candidate
- Symptom: Risk of a permanent full-screen overlay.
- Cause: `.g-page-loader` is fixed at `z-index: 2147483647` and only the
  page-load interaction sets `display: none`.
- Fix: 4 s CSS fade-out backstop in §09, disabled on the canvas via
  `html.wf-design-mode` and skipped under reduced motion.
- Status: fixed 682fd0f
- Found by: human

### 2026-08-21 · One failing inline script took out the rest of the footer
- Area: js
- Scope: project
- Symptom: A throw (e.g. Lenis init `ReferenceError` when GSAP was missing)
  stopped every later script in the same block.
- Cause: The old footer ran everything as two large inline blocks.
- Fix: `js/pomp.js` runs each module on `DOMContentLoaded` in its own
  `try/catch`, with `gsap`/`ScrollTrigger` guarded (README "What changed").
- Status: fixed 682fd0f
- Found by: human

### 2026-08-21 · Colon-break logic shipped twice
- Area: js
- Scope: project
- Symptom: The registered script `colon_break-1.0.0.js` duplicated the
  inline colon-break code.
- Cause: Logic was added both as a registered script and inline.
- Fix: `js/pomp.js` §4 owns it; the registered script must be deleted in
  Site settings → Custom code (manual Webflow step, `webflow/_footer.html`).
  Not verifiable from the repo.
- Status: open
- Found by: human

### 2026-08-21 · Repo CSS is not visible on the Designer canvas
- Area: designer
- Scope: project
- Symptom: Designer canvas renders without the site's custom styles.
- Cause: The CSS `<link>` is in head custom code, which the canvas does not
  run.
- Fix: temporary Embed with an inline copy while designing, deleted before
  publish; it drifts unless refreshed (README "Known trade-off"). Prefer
  moving styles into the Designer.
- Status: documented
- Found by: human

## Known from previous projects

Inherited from `wf-template`. Found across earlier client repos; listed so
they are not rediscovered. Status refers to the template. Only the entries
that apply to this repo's setup are copied.

### 2026-10-02 · Neutralizers in §03 override Designer styles
- Area: css
- Scope: template-candidate
- Symptom: A style changed in the Designer has no effect on the page.
- Cause: `src/styles.css` loads after `webflow.css`, so the §03 `.w-*` rules
  win same-specificity ties by source order. `.w-layout-blockcontainer
  { max-width }` silently overrode Designer container caps (threestars
  b5f122c); the `.w-dropdown-toggle` reset broke Webflow's chevron spacing
  (reformdd 8c65a5c).
- Fix: reformdd removed ten neutralizers so "Webflow's own defaults now stand
  unopposed" (c2e5f4b). Delete a neutralizer the moment it fights the
  Designer.
- Status: open
- Found by: human

### 2026-10-02 · Root font-size scale drifts from Designer tokens
- Area: css
- Scope: template-candidate
- Symptom: Designer variables named for px values ("Max Width - 1280px")
  render at different sizes; the scale is retuned again and again.
- Cause: The §01 fluid scale sets `:root` font-size, so every rem/em value
  coming out of the Designer scales with it. reformdd retuned it seven times
  (1680 → 1440 → 1680 → clamp → revert → 1920 → 1440); threestars found em
  layout tokens rendering 6.25% short.
- Fix: none general. Agree the scale with the designer before building, or
  drop it and let Webflow variables own sizing.
- Status: open
- Found by: human

### 2026-10-02 · Renaming a Webflow variable silently breaks repo CSS
- Area: css
- Scope: template-candidate
- Symptom: A container cap or token-driven value quietly stops applying.
- Cause: Container/Max Width was renamed to Section/Max Width in Webflow.
  Webflow rewrites its own references but cannot reach this bundle, so
  `var(--_layout---container--max-width, none)` fell back to `none`
  (reformdd 1ca59f6).
- Fix: avoid referencing Webflow variable names in repo CSS; if one is
  needed, log it here so renames get checked.
- Status: open
- Found by: human
