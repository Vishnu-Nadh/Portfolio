import type { PortfolioData } from "@/types/portfolio";
import { createContext } from "./context";
import { $, $$, lerpK, sleep } from "./utils";
import { createSmoothScroll } from "./modules/smoothScroll";
import { createToast } from "./modules/toast";
import { createClock } from "./modules/clock";
import { createCursor } from "./modules/cursor";
import { createKineticType } from "./modules/kineticType";
import { createOrbit } from "./modules/orbit";
import { createTrajectory } from "./modules/trajectory";
import { createSignal } from "./modules/signal";
import { createHorizon } from "./modules/horizon";
import { createLogoFill } from "./modules/logoFill";
import { createMagnets } from "./modules/magnets";
import { createCounters } from "./modules/counters";
import { createReveals } from "./modules/reveals";
import { createPageTransition } from "./modules/pageTransition";
import { createNavigation } from "./modules/navigation";
import { createMotionToggle } from "./modules/motionToggle";
import { createIntro } from "./modules/intro";
import { createScene3D } from "./modules/scene3d";
import { createContact } from "./modules/contact";
import { createMeteor } from "./modules/meteor";

declare global {
  interface Window {
    /** Set by the pre-paint boot script; cleared once the page has entered. */
    __folioFailsafe?: number;
  }
}

/**
 * Boots every interaction on the already-rendered page and returns a destroy function.
 * Modules are created in the same order as the design's script so per-frame
 * updates run in the same sequence.
 */
export function createMotionEngine(data: PortfolioData): () => void {
  const ctx = createContext(data);
  const { S, root } = ctx;

  // ---------- modules (order matters: it is the per-frame order) ----------
  const scroll = createSmoothScroll(ctx);
  createToast(ctx);
  createClock(ctx);
  const cursor = createCursor(ctx);
  const hero = createKineticType(ctx);
  createLogoFill(ctx);
  const magnets = createMagnets(ctx);
  const counters = createCounters(ctx);
  const reveals = createReveals(ctx, counters);
  // pinned scroll scenes
  createSignal(ctx);
  createHorizon(ctx);
  createOrbit(ctx, scroll);
  createTrajectory(ctx, scroll);
  createMeteor(ctx, scroll);
  // 3D stage (renders last each frame; the transition, contact console and intro drive it)
  const stage = createScene3D(ctx);

  // ---------- measurement ----------
  let measureRaf = 0;
  const measureAll = () => {
    hero.fit();
    ctx.measureFns.forEach((fn) => fn());
  };
  const queueMeasure = () => {
    cancelAnimationFrame(measureRaf);
    measureRaf = requestAnimationFrame(measureAll);
  };
  const remeasureFonts = () => {
    hero.invalidate();
    queueMeasure();
  };
  ctx.on(window, "resize", queueMeasure);
  const ro = new ResizeObserver(queueMeasure);
  ro.observe(document.body);
  if (document.fonts) {
    document.fonts.ready.then(() => ctx.flags.alive && remeasureFonts());
    ctx.on(document.fonts, "loadingdone", remeasureFonts);
  }
  ctx.cleanup(() => {
    cancelAnimationFrame(measureRaf);
    ro.disconnect();
  });

  // ---------- page entrance ----------
  function enterPage() {
    if (S.on && !root.classList.contains("entered")) {
      // underline / dash draw in once the name has landed
      [$(".hero__dash"), $(".hero__ul")].forEach((n) => {
        if (!n) return;
        const a = n.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], { duration: 1000, delay: 1500, easing: ctx.ease.io, fill: "both" });
        a.onfinish = () => a.cancel();
      });
      // lead copy rises letter by letter
      $$("[data-pin]").forEach((n) => {
        const a = n.animate([{ transform: "translateY(55%)", opacity: 0 }, { transform: "none", opacity: 1 }], {
          duration: 1100,
          delay: Number(n.dataset.d),
          easing: ctx.ease.out,
          fill: "both",
        });
        a.onfinish = () => a.cancel();
      });
      // name letters rise
      $$("[data-in]").forEach((n, i) => {
        const a = n.animate([{ transform: "translateY(115%)" }, { transform: "translateY(0)" }], {
          duration: 1300,
          delay: 80 + 55 * i,
          easing: ctx.ease.out,
          fill: "both",
        });
        a.onfinish = () => a.cancel();
      });
    }
    root.classList.add("entered");
    clearTimeout(window.__folioFailsafe);
    reveals.setUp();
    measureAll();
  }

  const transition = createPageTransition(ctx, cursor, scroll, stage);
  createNavigation(ctx, scroll, transition);
  const toggle = createMotionToggle(ctx, {
    cursor,
    scroll,
    resettables: [hero, magnets],
    setUpReveals: reveals.setUp,
    queueMeasure,
  });
  createContact(ctx, scroll, stage);
  const intro = createIntro(ctx, cursor, scroll, stage, enterPage);

  // ---------- ticker ----------
  let rafId = 0,
    lastNow = 0,
    lastY = scrollY;
  function tick(t: number) {
    S.k = lastNow ? Math.min(Math.max(t - lastNow, 1) / (1000 / 60), 4) : 1;
    lastNow = t;
    const lenis = scroll.lenis;
    if (lenis) lenis.raf(t);
    const y = scrollY;
    const v = (lenis ? lenis.velocity : y - lastY) / S.k;
    lastY = y;
    S.vel += (v - S.vel) * lerpK(0.12, S.k);
    ctx.frameFns.forEach((fn) => fn(t, S.k, y));
    rafId = requestAnimationFrame(tick);
  }
  ctx.cleanup(() => cancelAnimationFrame(rafId));

  // ---------- boot ----------
  toggle.syncScrub();
  cursor.syncNative();
  scroll.start();
  rafId = requestAnimationFrame(tick);
  measureAll();

  const begin = () => {
    if (S.on && root.dataset.intro === "run") intro.run();
    else {
      delete root.dataset.intro;
      enterPage();
    }
  };
  // hero metrics need the real font, so wait for it (bounded) before the first reveal.
  // The intro does not wait for the 3D stage: its horizon draw covers the stage's start-up.
  const ready = document.fonts?.ready ? Promise.race([document.fonts.ready, sleep(1800)]) : Promise.resolve();
  ready.then(() => {
    if (!ctx.flags.alive) return;
    hero.invalidate();
    measureAll();
    begin();
  });

  return () => ctx.dispose();
}
