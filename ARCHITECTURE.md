# Architecture

Next.js App Router, SCSS modules, anime.js v4, two routes (`/`, `/work`) sharing one scroller. Design language, scroll/scene model and SVG patterns: [.agent-docs/design-system.md](.agent-docs/design-system.md).

```
src/
  app/
    layout.tsx          THE shared scene: Backdrop, TopCover, MenuWindow, <main> scroller, top padder + sticky Logo, {children}, footer JnaoLogo, SiteMenu, HistoryScenes, RotateNotice; ART_RATIOS inline on <html>
    page.tsx            home segments only, ids from its local SECTIONS list + a numbers-only Ruler
    work/page.tsx       one snap segment per `projects` entry (id = slug) + a Ruler with project names
    work/work.module.scss  project segment, icon, text, scroll-driven enter fade
    page.module.scss    scroller, .segment, .padder, .title, .footer, .link/.listLink
    globals.scss        colour + layout tokens, reset
    icons.ts            favicon metadata → public/favicons/
    pageMetadata.ts     THE per-page metadata builder (title, description, canonical, full openGraph); every page's `metadata` goes through it
    sitemap.ts          lists every route; add new routes to PATHS
    robots.txt/route.ts allow all, Content-Signal preferences, points at the sitemap
    llms.txt/route.ts   lib/siteSummary.ts as text/plain; next.config.js advertises it and the sitemap in the homepage Link header
    index.md/route.ts   lib/siteSummary.ts as text/markdown; next.config.js rewrites `Accept: text/markdown` requests for pages here and sets `Vary: Accept`
  constants.ts          SCROLLER_ID (id of the layout's <main>), UI_CHROME (class for UI the footer finale fades), SITE_URL / SITE_NAME / SITE_DESCRIPTION / CONTACT_EMAIL
  data/projects.ts      THE project list for /work (name, links, kind, optional icon, about)
  data/music.ts         THE music links (name, href)
  lib/
    backdropRequest.ts  store letting a click switch the Backdrop before the route changes; isColourPath; useSceneColour() = THE scene colour (request ?? pathname)
    backdropFrame.ts    THE print clock: plain publish/subscribe/get store of the Backdrop's frame ({ art, time, fade, w, h }), published on every Backdrop draw; never React state
    affine.ts           2D affine matrices ([a,b,c,d,e,f]): apply, multiply, parseMatrix, matrixAttr
    svgArt.ts           SvgArt type ({ viewBox, transform, paths }) for swappable artwork modules + aspect/viewBoxOf
    siteSummary.ts      THE markdown site summary for agents, built from data/projects.ts and data/music.ts
  hooks/
    useSceneLink.ts     THE page-change routine (startScene: swap after both the scroll to top and RULER.outMs) + click hook
    useAnimatedLogo.ts  THE stroke-pulse animation for logo SVGs
    useFinaleBlur.ts    true while <html>'s --finale-blur (footer finale) is above 0
  components/
    Backdrop/           fixed clean photo layers (.mono / .still) and a paper cover (.paper, until the first print) under a WebGL2 CMYK print of the current page's photo; print.ts = THE print module (PRINT settings, TOTAL_MS/LEAVE_SPEED, revealTime, mirror, PRINT_IN + sceneFade/loadPress print-in timing, lodBias, scroll fade helpers, Art/pickArt/paintArt, coverRect); printShader.ts = the GLSL; printer.ts = createPrinter (WebGL2 renderer, null without WebGL2); backdropPrint.ts = the Backdrop's clock, scene/load print-ins, paper-cover rule, redraw/skip rule and publish
    TopCover/           invisible fixed black top strip (opacity 0, --top-cover-height tall) that iOS Safari samples to keep its status bar black
    SiteMenu/           fixed top-right lettered spine (ink layer): outlined home/work words read bottom→top, wipe carriers for MenuWindow; words.ts = the words' SvgArt, spine.ts = rotation + wordMatrix (shared with MenuWindow)
    HistoryScenes/      runs browser back/forward through startScene
    MenuWindow/         THE window layer of the menus: one fixed rail <canvas> (normal blend) painting the other page's photo through every [data-window] carrier, printed by its own createPrinter on backdropFrame's mirrored clock and fade
    RotateNotice/       full-screen "rotate your phone" notice on phone-sized landscape touch screens; hides every <body> child without ROTATE_KEEP
    ExternalIcon/       inline box-and-arrow SVG after external link text; currentColor
    Ruler/              fixed segment ruler (ink layer), one per page, props { label, items: { id, name? }[] }, wrapped in a built-in `00` row (top of the scroller) and an end row (footer logo rest, `LOGO_REST_ID`): scale, long ticks, numbers (+ names ≥48rem), hollow needle; current.ts = THE >50%-of-the-scroller rule; timing.ts = THE RULER choreography constants (startScene reads RULER.outMs); needle.ts = the needle triangle points
    WorkLink/           inline link to /work using the scene routine
    SvgPathWrapper/     THE <g> wrapper paired with useAnimatedLogo
    Logo/               sticky header logo (draggable); art.ts = its SvgArt
    JnaoLogo/           footer logo: one <svg> per shard (shards.ts); finale.ts = explode/re-form timeline, orbit-to-reverse leave + FINALE tuning constants; orbit.ts = idle orbit controller + ORBIT tuning constants
    Eyes/               blinking inline glyph in copy
    GoksoyraLogo/       music link logo
    DMBLogo/            music link logo
    BakersMathsLogo/    data-attribute-driven draw timeline; not rendered anywhere
  assets/images/        bg.jpg (mono), forest.jpg / fireweed.jpg (colour), projects/*.png icons
```

`prototypes/` holds standalone design prototypes, outside the Next build and excluded from biome. `prototypes/print-raster/index.html` is a WebGL newspaper-print raster tuner (one ink or CMYK plates, wear, reveal, scroll fade) over the site photos; run `prototypes/print-raster/build-images.sh` once (writes the gitignored `images.js`), then open `index.html` straight from disk.

Agent discovery (Link header, llms.txt, markdown negotiation, Content-Signal), including how to repeat it on other sites: [.agent-docs/ai-discoverability.md](.agent-docs/ai-discoverability.md).

Tests: `pnpm test` (Vitest, Node environment, `src/**/*.test.ts`; pure logic only, no DOM). Lint: `pnpm lint` (`biome check`: lint, format, import order; includes the `next` and `react` rule domains). Biome does not type-check; `pnpm exec tsc --noEmit` does.
