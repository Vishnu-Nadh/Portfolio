# Folio: Next.js portfolio

Next.js (App Router) implementation of the Claude Design file `Folio Draft 3D.html`: a dark, space-themed portfolio with a WebGL orb, pinned scroll scenes and kinetic type.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

> Both scripts use `--webpack`. Turbopack ignores `adjustFontFallback: false` in `next/font`, so glyphs the fonts lack (e.g. `→`) would render in a resized Arial instead of the system fallback.

## Where to change things

| What | File |
| --- | --- |
| **All content** (name, hero copy, skills, experience, stats, nav, labels) | `src/data/portfolio.ts` |
| **Theme** (colours, fonts, font-variation presets, easings, spacing, breakpoints) | `src/styles/abstracts/_tokens.scss` |
| Content types | `src/types/portfolio.ts` |

The tokens are emitted as CSS custom properties on `:root`. The motion engine and the 3D scene read the colours, easings and breakpoints from those properties at runtime, so CSS, JS and WebGL stay in sync.

## Page

| Section | What it does |
| --- | --- |
| Intro | Galaxy intro: the stars warp in, the orb condenses at the centre, the name surfaces through blur, then the page fades up. Plays once per session; click or Esc fast-forwards. |
| Hero | Kinetic name: each letter widens and thins near the pointer (Hubot Sans `wdth`/`wght`). The lead copy rises letter by letter. |
| Skills | Pinned orbital system. Scroll turns the orbit, the front planet is the active skill, and clicking a planet jumps to it. The orb is the sun. |
| Experience | Pinned trajectory. A probe travels oldest → newest past a station per role, with the camera trailing for parallax. |
| About | Pinned "signal": the statement lights up word by word, then the stat lines fill. The orb drops its glass to show the wire core. |
| Contact | "Event horizon": an accretion disk around the CTA, with the orb parked at its centre. |

## Structure

```
src/
  app/                 layout (fonts, metadata, pre-paint boot script), page
  data/                single content source
  components/
    layout/            Header, Footer (event horizon)
    sections/          Hero, OrbitSkills, Trajectory, Hello
    overlays/          Cursor, Toast, PageTransition, Intro, Scene3D (canvas + poster)
    ui/                Logo, SplitWords
    motion/            MotionEngine (the only client component)
  lib/motion/
    engine.ts          wires modules, measurement, ticker, boot
    context.ts         shared state, scene anchors, tracked listeners/cleanup
    bootScript.ts      runs before first paint (motion flag, once-per-session intro)
    modules/           one file per behaviour (see below)
  styles/
    abstracts/         tokens + mixins
    base/              root vars, reset, utilities, grain/lenis/gating
    components/        one partial per component (BEM)
```

## Animation stack

- **[three.js](https://threejs.org) 0.169**: the WebGL stage (glass shell with dispersion and iridescence, wire core, rings, dust, nebulae, twinkling star shader). It's loaded with a dynamic import and its shaders compile with `compileAsync`. The intro waits for the first frame (capped at 3s), and a CSS poster orb stands in until then or when WebGL is unavailable.
- **[Lenis](https://github.com/darkroomengineering/lenis) 1.3.15**: smooth scrolling, driven from the engine's ticker (`autoRaf: false`).
- **Web Animations API**: intro, page transition, reveals, word cascade, letter entrances.
- **A single `requestAnimationFrame` ticker** drives every per-frame module and the 3D render.
- **IntersectionObserver**: reveals and counters. **CSS**: the disk spin (`@property --ang`), panel crossfades, hovers.

Motion modules (`src/lib/motion/modules`): `smoothScroll`, `toast`, `clock`, `cursor`, `kineticType`, `logoFill`, `magnets`, `counters`, `reveals`, `signal`, `horizon`, `orbit`, `trajectory`, `pageTransition`, `navigation`, `motionToggle`, `intro`, `scene3d`.

React renders all markup on the server from `portfolio.ts`. `MotionEngine` mounts the engine once on the client and tears it down cleanly (including the WebGL context), so it is safe under Strict Mode and HMR. Nothing re-renders during animation.
