# Architecture

Next.js App Router, SCSS modules, anime.js v4, two routes (`/`, `/work`) sharing one scroller. Design language, scroll/scene model and SVG patterns: [.agent-docs/design-system.md](.agent-docs/design-system.md).

```
src/
  app/
    layout.tsx          THE shared scene: Backdrop, <main> scroller, top padder + sticky Logo, {children}, footer JnaoLogo, SiteMenu, HistoryScenes
    page.tsx            home segments only
    work/page.tsx       one snap segment per `projects` entry + ProjectNav
    work/work.module.scss  project segment, icon, text, scroll-driven enter fade
    page.module.scss    scroller, .segment, .padder, .title, .footer, .link/.listLink/.navItem
    globals.scss        colour tokens, reset
    icons.ts            favicon metadata → public/favicons/
    pageMetadata.ts     THE per-page metadata builder (title, description, canonical, full openGraph); every page's `metadata` goes through it
    sitemap.ts          lists every route; add new routes to PATHS
    robots.ts           allow all, points at the sitemap
  constants.ts          SCROLLER_ID (id of the layout's <main>), SITE_URL / SITE_NAME / SITE_DESCRIPTION
  data/projects.ts      THE project list for /work (name, href, kind, icon, about)
  lib/
    backdropRequest.ts  store letting a click switch the Backdrop before the route changes
  hooks/
    useSceneLink.ts     THE page-change routine (startScene) + click hook
    useAnimatedLogo.ts  THE stroke-pulse animation for logo SVGs
  components/
    Backdrop/           fixed mono photo + canvas halftone reveal of the colour photo on /work
    SiteMenu/           fixed top-right home/work column
    HistoryScenes/      runs browser back/forward through startScene
    ExternalIcon/       inline box-and-arrow SVG after external link text; currentColor
    ProjectNav/         fixed project list on /work; current = project filling >50% of the scroller
    WorkLink/           inline link to /work using the scene routine
    SvgPathWrapper/     THE <g> wrapper paired with useAnimatedLogo
    Logo/               sticky header logo (draggable)
    JnaoLogo/           footer logo
    Eyes/               blinking inline glyph in copy
    GoksoyraLogo/       music link logo
    DMBLogo/            music link logo
    BakersMathsLogo/    data-attribute-driven draw timeline; not rendered anywhere
  assets/images/        bg.jpg (mono), forest.jpg / fireweed.jpg (colour), projects/*.png icons
```

Lint: `pnpm lint` (Biome).
