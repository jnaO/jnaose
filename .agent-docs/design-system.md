# Design system

Two routes sharing one scroll-snap scene: one line of copy (or one project) per screen, scrolling over a fixed photo, orange ink inverted by blend mode. `/` sits on a B/W photo, `/work` on a colour one.

## Tokens
- Ink `--text-color: orange`; hover/focus `--highlight-color: #FFFFFF` (`src/app/globals.scss`). Dark-mode block does not override either.
- Accent `gold`: stroke of the header logo only (`Logo` config).
- Font: Rajdhani 400 via `next/font`, class on `<body>`, var `--font-rajdhani`. Body copy 1rem / 1.5.
- Gutter: `max(env(safe-area-inset-*), 1rem)`.
- Backdrop: `Backdrop` (fixed, `z-index: -1`) — `bg.jpg` as a CSS layer (`cover`, `center left`) plus a `<canvas>` holding the colour photo on `/work`. `html` has a white/black 50/50 gradient behind it. Its last child `.blur` (`inset: 0`) has `backdrop-filter: blur(calc(var(--finale-blur, 0) * $blur-max))` (`$blur-max` 24px, top of `backdrop.module.scss`); at rest it is `blur(0px)`. Only the footer finale writes `--finale-blur`. Trap: do not blur `.backdrop` itself with `filter` — a filter samples transparent pixels past the element's edge, so the edges go see-through and the `html` gradient shows as a white/black haze (overscanning the element did not fix it in Safari). `backdrop-filter` samples past its edges from its own edge pixels.

## Blend model
`mix-blend-mode: difference` on `.segment`, `.title`, `.link`, `Logo` path, `JnaoLogo` `.stage`. Orange reads differently over sky vs ground — this contrast shift IS the look. Any new foreground element joins it by applying `difference`; a solid background on an ancestor breaks the effect.
- **UI fade contract:** the footer finale fades out every element carrying the global class `ui-chrome` (`UI_CHROME` in `src/constants.ts`): currently `h1.title`, the `SiteMenu` nav and the `ProjectNav` nav. `globals.scss` gives `.ui-chrome { opacity: var(--ui-opacity, 1) }` and `html[data-finale] .ui-chrome { pointer-events: none }`; the finale timeline tweens `--ui-opacity` 1 → 0 on `<html>` during the in phase, and the trigger toggles `data-finale` on `<html>`. Any new fixed or sticky UI must carry `ui-chrome` on the element that itself has `mix-blend-mode` — never on an ancestor (opacity < 1 there isolates the blend group and the UI changes colour mid-fade). The `Backdrop` does not fade. Keyboard focus of faded links is not managed.

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
| `JnaoLogo` | footer sticky `<h2>` stage → `.box` (`role=img`, `perspective` from `FINALE`, widened while orbiting) of 36 layered shard svgs (`shards.ts`), each at `opacity: var(--shard-opacity)` (.5, set on `.box`); looping spring heartbeat scales `.box`; scroll-triggered explode/re-form finale and idle orbit (see Footer finale); fixed colour classes (purple/green/blue/yellow + `*Plate`) |
| `Eyes` | inline in copy (1.6rem×1rem); `.blink` circles opacity keyframes, 5s loop delay |
| `GoksoyraLogo`, `DMBLogo` | `useAnimatedLogo` defaults (orange stroke, width 8/9) |
| `BakersMathsLogo` | one-shot `createTimeline`; see below. Not rendered anywhere |

### Footer finale (`JnaoLogo`)
- Tuning constants: `FINALE` at the top of `src/components/JnaoLogo/finale.ts` (seed, perspective, durations, eases incl. `leaveEase`, stagger, distance, jitter, rotation, depth, fullscreen opacity). Backdrop blur strength: `$blur-max` in `src/components/Backdrop/backdrop.module.scss`. Heartbeat constants: `C` in `JnaoLogo.tsx`. Keep `depthMax` < `perspective`, or shards pass behind the camera.
- Trigger: an `IntersectionObserver` (root = scroller, `threshold: RUNWAY_THRESHOLD` 0.5) on the `.runwaySnap` marker. The first callback only records the side (seeking to the end and starting the orbit if the page is already on the runway). Triggered, not scroll-scrubbed. After that a small state machine in `JnaoLogo.tsx` (`rest` → `flying` → `orbit` → `leaving`) decides what a crossing does:
  - `rest`/`flying`: in → `tl.play()`, out → `tl.reverse()`, both turning around from the current playhead.
  - `orbit` (including the ramp), out: `orbit.pause()` (holds the pose, keeps `data-orbit` and the widened perspective) and `finale.leave(orbit.poses, …)` plays: a paused timeline with `composition: 'none'` (the default `'replace'` would strip the paused `tl`'s tweens on the same shard properties) taking each shard from its live orbit values to its in-phase off-screen pose, and `--ui-opacity`/`--finale-blur` back to 1/0, over `inDuration` with `leaveEase`.
  - `leaving`: in → `leave.reverse()`, out → `leave.play()`. Reversed to its start, the orbit resumes from the kept `s` (speed ramping in again, no jump). Completed forward (every shard off-screen, both variables at rest): `orbit.stop()` then `finale.reverseFromMid()` = `tl.seek(midpoint).reverse()`, so the shipped out-phase reverse and geometry swap play unchanged; state `flying`. The seam swaps shards from their in-phase to their out-phase off-screen pose, both invisible.
  - Resize cancels a running leave (no revert: `tl.revert()` clears everything it and the orbit wrote), rebuilds, and on the runway resumes the orbit from the kept `s`.
- `createFinale()` builds one paused timeline: **out** (each `.shard` tweens `translateX/Y/Z`, `rotateX/Y/Z` from identity to a seeded off-screen pose: direction = viewBox centre → bbox centre + jitter, distance = stage diagonal + shard radius × 1.1–1.5) → label `mid`: `tl.set(box, { left, bottom, width, '--shard-opacity' })` to the contain-fit rect (stage minus the resting gutter, scaled by `FINALE.fullScale`, centred) → **in** (a second seeded pose → identity). Total ≈ 1.1s. From `mid` for `inDuration`, `<html>` also tweens `--ui-opacity` 1 → 0 and `--finale-blur` 0 → 1 (UI fade + backdrop blur); both variables live only in the in-phase, so at `mid` both are at rest.
- Randomness: `utils.createSeededRandom(FINALE.seed)`, created fresh per build and consumed in fixed shard order, so every run and every rebuild produces the same poses.
- `tl.onComplete` fires at both ends (`self.reversed` tells which). At rest after a reverse the timeline is `revert()`ed and rebuilt, which clears every inline transform/geometry it wrote. Resize with a changed stage size also reverts and rebuilds, then seeks to the end if on the runway. The heartbeat runs only at rest: `pulse(false)` pauses it and seeks it to 0 (scale 1) whenever the finale leaves rest (including a load straight onto the runway), and `pulse(true)` resumes it only on the settle at rest or a resize off the runway. No pulse during the fullscreen logo or the orbit.
- The timeline lives outside the `createScope` (it is rebuilt after each round trip); the effect cleanup reverts it. Do not use `tl.call()` for state: it does not fire in reverse.
- `.box` must be at its resting CSS placement (`left`/`bottom`/`width` only) when `createFinale` runs; the `set` reads those as its from-values.
- Opacity lives on each `.shard`, never on `.box`: opacity < 1 on `.box` flattens its `preserve-3d`. Overlapping shards therefore blend with each other (accepted shift from the pre-finale logo).
- **Idle orbit** (`src/components/JnaoLogo/orbit.ts`, tuning constants `ORBIT`: seed, tilt, base turn, cycle turns, per-shard turn choices, ramp, float, z budget, layer gap, plate spins). `createOrbit()` returns a controller; `start()` (from `s = 0`, the flat logo) runs whenever the finale settles forward (including the silent seek when the page loads on the runway, and a resize rebuild while flying on the runway); `resume()` continues from the kept `s`, `pause()` holds the pose still engaged, `stop()` pauses and disengages, `measure()` rescales after a resize. Each frame an anime `createTimer` writes `translateX/Y/Z` and `rotateX/Y/Z` per shard with `utils.set` (anime's transform cache stays current). Pose: each shard moves as a rigid body, tidally locked — R = rotation by θ about the view axis tilted `tilt` towards the top, at a seeded `n ∈ shardTurns` whole turns per cycle (`cycle = cycleTurns × turn`), θ = 2π·n·s/cycle. Its centre `p0` (bbox centre − logo centre, scaled to the `.box` width) goes to R·p0 plus a seeded float height along the axis × sin²(π·s/cycle), and the shard turns by the same R about its own centre (the default `transform-origin`), so the same side always faces the centre and it is seen at an angle, edge-on or from behind. Plate shards (`*Plate` tones) first spin about their own seeded unit axis through their centre, at a seeded `m ∈ plateSpins` whole spins per cycle (φ = 2π·m·s/cycle, drawn from a second seeded random so the orbit's own sequence is unchanged); the total rotation is R·S(φ), so a plate tumbles while staying carried by its orbit. Whole spins keep the line-up exact. R is written as `eulerXYZ()` angles because anime emits rotations in the fixed order rotateX → rotateY → rotateZ (CSS rotation matrices are the standard ones in x right, y down, z towards the viewer, so they match `rotate()`'s Rodrigues maths). All θ are whole turns and the float is 0 at every cycle end, so every shard lands exactly in its logo pose (R = I, no translation) every cycle. z is never scaled (that would break the rigid motion): while orbiting, `.box`'s CSS `perspective` widens to max(`FINALE.perspective`, deepest centre |z| / `zBudget`), set inline by `orbit.ts` and restored to `FINALE.perspective` by `stop()`; `layerGap × index` keeps DOM paint order among coplanar shards. Orbit time `s` accumulates through a smoothstep speed ramp over `ramp` (so line-ups land `ramp/2` late), is wrapped to one cycle, and survives a resize (`measure()` rescales). While engaged (running, paused, and through the leave until the seam), `.box[data-orbit]` gets `transform-style: preserve-3d` (real front/back ordering); everywhere else stays flat in DOM order. Uses its own seeded random, so `FINALE`'s sequence is unaffected. Do not tween `perspective` on `.box` through anime: anime writes it as a `perspective()` transform, not the CSS property.

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
