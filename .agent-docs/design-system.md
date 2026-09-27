# Design system

Two routes sharing one scroll-snap scene: one line of copy (or one project) per screen, scrolling over a fixed photo, orange ink inverted by blend mode. `/` sits on a B/W photo, `/work` on a colour one.

## Tokens
- Ink `--text-color: orange`; hover/focus `--highlight-color: #FFFFFF` (`src/app/globals.scss`). Dark-mode block does not override either.
- Accent `gold`: stroke of the header logo only (`Logo` config).
- Font: Rajdhani 400 via `next/font`, class on `<body>`, var `--font-rajdhani`. Body copy 1rem / 1.5.
- Gutter: `max(env(safe-area-inset-*), 1rem)`.
- Backdrop: `Backdrop` (fixed, `z-index: -1`) — `bg.jpg` as a CSS layer (`cover`, `center left`) plus a `<canvas>` holding the colour photo on `/work`. `html` has a white/black 50/50 gradient behind it.

## Blend model
`mix-blend-mode: difference` on `.segment`, `.title`, `.link`, `Logo` path, `JnaoLogo` `.stage`. Orange reads differently over sky vs ground — this contrast shift IS the look. Any new foreground element joins it by applying `difference`; a solid background on an ancestor breaks the effect.

## Scroll model
- `layout.tsx` owns the scroller: `<main id={SCROLLER_ID} class=.main>` (100vh, `overflow-y: scroll`, `scroll-snap-type: y mandatory`) → `.padder` → sticky `h1.title` Logo → page `{children}` → `footer.footer` JnaoLogo. The document itself does not scroll.
- Pages render segments only. Home: `<section className={styles.segment}>` (100% of the scroller, snap `end`, content bottom-left). Work: `.project` (100% of the scroller, snap `end`).
- `.footer` is `position: relative; height: 200%` (two scroller heights) with **no** snap-align of its own — a 200% snap area would allow free scrolling inside it. `JnaoLogo` renders into it: two absolute `pointer-events: none` snap markers (`.footerSnap` at `top: 0`, `.runwaySnap` at `top: 50%`, each `height: 50%`, snap `end`) and the `<h2>` stage (`position: sticky; top: 0; height: 50%`, full width, `pointer-events: none`). The stage stays pinned between the footer snap and the runway snap (= max scroll), so the logo does not move while scrolling between them. `.box` sits in the stage at `left`/`bottom` = gutter.
- `SiteMenu`/`ProjectNav` are `position: fixed` inside/after the scroller; they join the blend because nothing between them and the backdrop creates a stacking context.

## Scene model (page changes)
- `startScene(href, swap)` (`src/hooks/useSceneLink.ts`) — THE page-change routine; `useSceneLink` (menu, `WorkLink`) and `HistoryScenes` (back/forward) both call it. Order: `requestColour` (halftone starts, runs alongside the scroll) → smooth-scroll to top (`scrollend`, 1s fallback) → `swap()` (`router.push`/`replace` with `scroll: false`). The new page always starts at the top; nothing scrolls it down.
- Only the segments under the shared logo change; the logo moves purely by scrolling.
- All links into the scene pass `scroll={false}`; Next's own scroll reset would fight the scroller.
- `prefers-reduced-motion` is not consulted anywhere; all motion always runs.

## Backdrop halftone (`src/components/Backdrop/Backdrop.tsx`)
- Colour = `requested ?? isColourPath(pathname)`; `requestColour` lets the click start the reveal before the route changes, reset to `null` on every pathname change.
- Colour photo: `forest.jpg` when landscape, `fireweed.jpg` (shifted up by `offset`) when portrait; scaled to viewport width, bottom `FADE` share faded into black.
- Reveal: rotated (`SCREEN_ANGLE`) dot lattice, spacing `SCREEN_MIN–MAX` px, dot radius ∝ √luminance. Two sweeps from the top-left: print, then merge (`MERGE_DELAY_MS` = half a sweep) until dots close into the photo. Leaving runs the same timeline backwards at `LEAVE_SPEED`.
- The canvas redraws only when colour changes; resize does not repaint.

## Work page
- Content comes from `src/data/projects.ts`; adding a project = one entry + an icon in `assets/images/projects/`.
- `.icon`/`.text` fade up via `animation-timeline: view()` (`entry 0% → entry 100%`), behind `@supports`.
- `ProjectNav`: current = project whose rect covers > half the scroller, else none; click → `scrollIntoView({ block: 'end', behavior: 'smooth' })`. Items animate in/out with per-item `--in`/`--out` delays; `leaving` = `useRequestedColour() === false`. Below 48rem only numbers show, positioned under `SiteMenu`.

## Links
- `.link` (text): inline-flex, 3rem tall, bottom-aligned, `padding-right: 1rem`. Rest: transparent outline + bg. Hover/focus: white text, 1px white outline, 20% white bg. Durations in `.1s` on hover, `.9s/.5s/1.3s` (color/outline/bg) out — asymmetric by design.
- `.listLink` (logo): `@extend .link`, 5rem square, swaps `fill` to highlight on hover. Lives in `ul.list > li.listItem` (flex row, 1rem gap via margin).
- `.navItem` (menus): `@extend .link`, 2.75rem tall, no fill on hover/focus (outline only); current page/project gets `.navCurrent` (white).
- Logo SVGs get their colour from inherited/`var(--text-color)` `fill`, never a hardcoded fill attribute — otherwise hover cannot recolour them.

## SVG conventions
- Always inline JSX components in `src/components/<Name>/<Name>.tsx` + `<name>.module.scss`; no `<img>`. Paths keep their exported `matrix(...)` transforms.
- Exception, `JnaoLogo`: each of its 36 paths is its own `<svg>` (CSS 3D transforms do not apply to SVG children). Path data lives in `JnaoLogo/shards.ts` as `{ d, tone, bbox }`; `bbox` is the path's bounding box in the 994×981 viewBox plus ~1 unit padding. Each shard svg uses that bbox as `viewBox`, `preserveAspectRatio="none"`, and `left/top/width/height` = bbox as percentages of 994×981 inside `.box` (`aspect-ratio: 994 / 981`). Changing a path's `d` means re-measuring its bbox.
- `SvgPathWrapper` — THE `<g>` wrapper for stroke-animated logos: carries `transform`, `fillRule=evenodd`, `stroke`, `strokeWidth=0`.
- `useAnimatedLogo(ref, config)` (`src/hooks/useAnimatedLogo.ts`) — THE stroke-pulse animation. Animates every `<path>` under `ref`: `draw 0→1`, strokeWidth `0 → full → 0 → ...extraStrokeWidths → 0`, 100ms stagger per path, random loop delay (4–7s default). Mobile (Bowser) uses `strokeWidthMobile`; IE skipped. Returns `strokeColorAlternative` to pass into `SvgPathWrapper`. Used by `Logo`, `DMBLogo`, `GoksoyraLogo`.
- One-off animations use `createScope({ root })` in a `useEffect` with `scope.revert()` cleanup, targeting a global (non-module) class string, e.g. `'.logo'`, `'.wrapper'`, `'.blink'`.

| Component | Behaviour |
|---|---|
| `Logo` | header; `useAnimatedLogo` gold pulse + scale bounce-in + `createDraggable` springing back to origin |
| `JnaoLogo` | footer `<h2>` → `.box` (`role=img`, opacity .5, `perspective` from `C`) of 36 layered shard svgs (`shards.ts`); looping spring heartbeat scales `.box`; fixed colour classes (purple/green/blue/yellow + `*Plate`) |
| `Eyes` | inline in copy (1.6rem×1rem); `.blink` circles opacity keyframes, 5s loop delay |
| `GoksoyraLogo`, `DMBLogo` | `useAnimatedLogo` defaults (orange stroke, width 8/9) |
| `BakersMathsLogo` | one-shot `createTimeline`; see below. Not rendered anywhere |

### BakersMathsLogo timeline
- Structure driven by data attributes: `g[data-stalk]` → paths with `data-type="stem"|"grain"|"whisk"`, grains ordered by `data-order`.
- Stems/grains: a stroke clone is drawn (`svg.createDrawable`) while the original's fill wipes bottom-to-top via a generated `clipPath` rect; the fill wipe ends when the outline does. Whisks: clip-wipe only.
- Randomised per run: easings, slot jitter, fill delay. Total ≈ `totalDuration` (6000ms); stalks overlap by `stalkOverlap`.
- `.drawing` class hides fill/stroke until animated; removed `onComplete`.

## Gotchas
- `logoanimated.module.scss` colours use `oklch(var(--color-logo-*))`; those vars are not defined in this repo, so the declarations are invalid at computed time and `fill`/`stroke` fall back to inherited — i.e. `.listLink` orange. Defining those vars will change the logo's colour.
- anime.js scopes select by global class string, not CSS-module class; the global class must be added alongside the module class (`classNames(styles.x, 'logo')`).
- `useAnimatedLogo` touches every `<path>` under the ref — non-animated paths must live outside that SVG.
- `HistoryScenes` must register its `popstate` listener before the App Router's (it does: child effects run first) and calls `stopImmediatePropagation`; if that order ever flips, back/forward swap without the scroll-to-top.
- Offsets inside the scroller are `main.scrollTop + rect.top - main.rect.top`; dropping the `scrollTop` term breaks on a second effect run (React strict mode).
- `tsconfig` targets ES5: iterating a `Set`/`Map` with `for…of` fails typecheck — use `.forEach`.
