# Folio: Next.js portfolio

Next.js (App Router) port of `Folio Motion Base.html`. The markup, styling and motion match the original.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

> Both scripts use `--webpack`. Turbopack ignores `adjustFontFallback: false` in `next/font`, so glyphs the fonts lack (e.g. `→`) would render in a resized Arial instead of the system fallback the original uses.

## Where to change things

| What | File |
| --- | --- |
| **All content** (name, projects, copy, stats, nav, toasts) | `src/data/portfolio.ts` |
| **Theme** (colours, fonts, font-variation presets, easings, radii, breakpoints) | `src/styles/abstracts/_tokens.scss` |
| Content types | `src/types/portfolio.ts` |

The tokens are emitted as CSS custom properties on `:root`. The motion engine reads the easings and the mobile breakpoint from those properties at runtime, so CSS and JS animations always use the same values.

## Structure

```
src/
  app/                 layout (fonts, metadata, pre-paint boot script), page
  data/                single content source
  components/
    layout/            Header, Footer
    sections/          Hero, Marquee, work/ (Work, WorkRow, Dock, ProjectLayers), CloseUp, Hello
    overlays/          Cursor, Toast, PageTransition, Intro, FloatingCard
    ui/                Logo, Art, SplitWords, ArrowIcon
    motion/            MotionEngine (the only client component)
  lib/motion/
    engine.ts          wires modules, measurement, ticker, boot
    context.ts         shared state + tracked listeners/cleanup
    bootScript.ts      runs before first paint (motion flag, once-per-session intro)
    modules/           one file per behaviour (see below)
  styles/
    abstracts/         tokens + mixins
    base/              root vars, reset, utilities, grain/lenis/gating
    components/        one partial per component (BEM)
```

## Animation stack

The same stack as the original, with no extra animation libraries:

- **[Lenis](https://github.com/darkroomengineering/lenis) 1.3.15**: smooth scrolling, driven from the engine's ticker (`autoRaf: false`).
- **Web Animations API** (`element.animate`): intro, page transition, reveals, word cascade, hero letter entrance.
- **A single `requestAnimationFrame` ticker** runs the per-frame modules in the original order: cursor → kinetic type → marquee → work/card → close strip → logo fill → magnets → counters.
- **IntersectionObserver**: triggers reveals and counters.
- **CSS transitions**: row hover fill, layer clip swap, links and buttons.

Motion modules (`src/lib/motion/modules`): `smoothScroll`, `toast`, `clock`, `cursor`, `kineticType`, `marquee`, `work`, `closeStrip`, `logoFill`, `magnets`, `counters`, `reveals`, `pageTransition`, `navigation`, `motionToggle`, `intro`.

React renders all markup on the server from `portfolio.ts`. `MotionEngine` mounts the engine once on the client and tears it down cleanly, so it is safe under Strict Mode and HMR. Nothing re-renders during animation.
