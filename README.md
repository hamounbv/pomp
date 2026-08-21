# pomp

Version-controlled custom code for **pompandcircumstancepr.com** (Webflow site `62a5f6c6cc39b911d78bd5b5`), served through **jsDelivr**.

```
css/pomp.css           → all site custom CSS (single source of truth)
js/pomp.js             → all site custom JS (Swiper + Lenis + NavShrink + colon-break + hero guard)
webflow/_header.html   → the Site Settings → Head block (paste into Webflow)
webflow/_footer.html   → the Site Settings → Footer block (paste into Webflow)
```

`css/pomp.css` consolidates the 14 KB inline stylesheet that lived in the `G | Embed Code` body component, and adds one new section (§09) of failsafes described below. `js/pomp.js` consolidates the four inline footer scripts — the Swiper service-slider init, the Lenis init, the NavShrink module and the colon-break IIFE — plus a hero video guard.

## jsDelivr rules (the important ones)

- **The repo must be public.** jsDelivr's `/gh/` endpoint doesn't serve private repos. (Fine — this code ships to every visitor's browser anyway.)
- URL shape: `https://cdn.jsdelivr.net/gh/hamounbv/pomp@VERSION/path/file`
- **Auto-minify:** request `pomp.min.css` / `pomp.min.js` and jsDelivr generates the minified file for you — commit only the readable source.
- **Pin a tag for production** (`@1.0.0`). Tagged URLs are cached permanently on the CDN — deploys are immutable and instant to roll back (just point the snippet at the previous tag).
- `@main` works for testing but is cached up to ~12 h — never use it in the production snippet.
- Emergency cache purge: `https://purge.jsdelivr.net/gh/hamounbv/pomp@1.0.0/css/pomp.min.css`

## Release workflow

1. Edit `css/pomp.css` or `js/pomp.js`, commit.
2. Tag: `git tag v1.0.1 && git push --tags` (tag names with `v` work as `@1.0.1` on jsDelivr).
3. Bump the version in `webflow/_header.html` + `webflow/_footer.html`, commit.
4. Paste the updated snippet(s) into Webflow Site Settings → Custom Code, publish.
5. Verify the new file loads (DevTools → Network), spot-check pages.

Rollback = step 3–4 with the previous tag.

## One-time Webflow cutover

**Add (Site Settings):** replace the head custom code with `webflow/_header.html` and the footer custom code with `webflow/_footer.html`.

**Then remove, in this order (everything is now in the repo files):**

1. `G | Embed Code` component → delete it. Its entire contents were the inline stylesheet, now in `css/pomp.css`.
2. Footer custom code → the old block (Swiper + its inline init, unpkg Lenis + its inline init, NavShrink, colon-break) is fully replaced by `webflow/_footer.html`; make sure none of it survives the paste.
3. Registered script `colon_break-1.0.0.js` → delete it in Site settings → Custom code. It was a second copy of the colon-break logic that already ran inline; `js/pomp.js` §4 owns it now.
4. Per-page schema, canonicals and the CMS template SEO bindings → see the fix kit; those are Webflow UI changes, not repo files.

**QA before publishing:** service slider (autoplay, loop, prev/next), smooth scroll, nav shrink past 5vh, colon line-breaks wherever `[data-colon-break]` is used, page loader dismisses, hero video plays *and* the hero is brand-coloured rather than black while it loads, GA4 and Ahrefs firing, no 404s in the Network tab.

**Known trade-off:** external stylesheets don't render in the Designer canvas. For canvas work, drop a temporary embed with an inline copy while designing and delete it before publish — expect it to drift from the repo unless refreshed.

## What changed vs the live code — review these

v1.0.0 is *not* byte-for-byte identical to what is on the site. Every difference is deliberate and listed here so you can veto any of them:

| Change | Why |
|---|---|
| Swiper init rewritten from jQuery `$(...).each()` to `querySelectorAll` | Same behaviour, one fewer dependency on load order. Also skips a slider that is already mounted, so it is safe to call twice. |
| Lenis instance exposed as `window.lenis` | It was a scoped `let` that nothing could reach. Nothing on the site currently reads it; exposing it means future modules can scroll through Lenis instead of fighting it. |
| Lenis init guards on `ScrollTrigger` / `gsap` existing, with a plain rAF fallback | The old code threw a `ReferenceError` and killed the rest of the script block if GSAP hadn't loaded. |
| All modules run on `DOMContentLoaded` inside a per-module `try/catch` | One module failing no longer stops the others. The old footer ran everything in two big blocks, so a single throw took out whatever followed it. |
| Swiper and Lenis now load with `defer` | They were parser-blocking. Deferred scripts still execute in document order, so the init order is unchanged. |
| **New:** `css/pomp.css` §09 page-loader backstop | `.g-page-loader` is `position: fixed` at `z-index: 2147483647` and its only exit is the Webflow page-load interaction writing `display: none`. A 4s CSS animation now fades it out regardless. The interaction normally finishes in well under a second, so this should never be visible. |
| **New:** `css/pomp.css` §09 hero ground + `js/pomp.js` §5 hero guard | This is the black-homepage fix. The video, its wrapper and the section are all transparent, so a video that fails to decode leaves only a black gradient painting a full-viewport area. The CSS paints `--brand-ground` behind it; the JS retries a blocked autoplay once and marks the wrapper `data-hero-video="failed"` after 6s. Change `--brand-ground` in §01 if you'd rather it degrade to a different colour. |
| Removed `.pre-loader { display: flex; }` from the head | Verified against ten pages spanning every template: no element on the site carries that class. The loader is `.g-page-loader`; the logo inside it is `.pre-loader-brand-logo`. |
| Removed the duplicate `<meta name="viewport" … maximum-scale=1>` | It disabled pinch-zoom, which Lighthouse flags as an accessibility failure. Webflow already emits a correct viewport tag. Keep form inputs at ≥16px to stop iOS zooming on focus. |
| Added the Ahrefs Analytics tag and the global JSON-LD to the head | Both were missing. The site had zero structured data across all 71 pages. |

## House rules

- Never edit CSS/JS inline in Webflow again — if it's style or behavior, it goes in this repo.
- Any full-screen overlay gets a failsafe. The preloader nearly proved why, and the hero video did.
- Media belongs on the Webflow CDN, not raw S3, and every hero video ships with a `poster`.
- Optional future cleanups: self-host the three Google font families as WOFF2 and drop the `webfont.js` hop, lazy-load the duplicated partner-logo strip, and confirm whether `recaptcha/api.js` (synchronous, render-blocking, in the head) is still needed by a live form.
