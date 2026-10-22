import type { MotionContext } from "../context";
import type { Cursor } from "./cursor";
import type { SmoothScroll } from "./smoothScroll";
import type { IntroPose, Stage } from "./scene3d";
import { $, $$, sleep } from "../utils";

export const INTRO_SEEN_KEY = "folio-intro";

/** gentle out-curve used throughout the intro: no hard cuts */
const SOFT = "cubic-bezier(.22,1,.36,1)";
/** half view height in world units at the orb's depth (camera fov 32°, distance 9) */
const HH = Math.tan((16 * Math.PI) / 180) * 9;
/** orb scale for an on-screen radius in px (shell radius 1.25) */
const scaleFor = (rPx: number) => ((rPx / (innerHeight / 2)) * HH) / 1.25;
/** pose y for a screen y in px */
const yFor = (py: number) => (0.5 - py / innerHeight) * 2;

/**
 * Planetrise intro: a horizon draws across the screen; the orb rises from behind it like a planet at dawn,
 * lighting the horizon and casting a faint reflection on the ground, while the name hangs below the horizon,
 * emerging downward from it and a counter runs to 100. On exit the name retracts, the ground sinks away and
 * the orb sails to its hero pose as the page fades up. Click / Esc fast-forwards (4x).
 */
export function createIntro(ctx: MotionContext, cursor: Cursor, scroll: SmoothScroll, stage: Stage, enterPage: () => void) {
  const { S, flags, root, ease } = ctx;
  const intro = $(".intro");
  let rate = 1;
  const restFvs = (italic: boolean) => (italic ? '"wdth" 110, "wght" 250' : '"wdth" 68, "wght" 850');

  async function run() {
    flags.introRunning = true;
    rate = 1;
    root.dataset.intro = "playing";
    // the engine is alive: the boot failsafe must not cut this (longer) intro short
    clearTimeout(window.__folioFailsafe);
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* storage blocked */
    }
    root.style.overflow = "hidden";
    scroll.pause();

    const letters = $$(".intro__ch", intro),
      box = $(".intro__box", intro);
    const meta = $(".intro__meta", intro),
      count = $(".intro__count", intro),
      line = $(".intro__line", intro),
      bg = $(".intro__bg", intro);
    const play = (n: HTMLElement, kf: Keyframe[], o: KeyframeAnimationOptions) => {
      const a = n.animate(kf, o);
      a.playbackRate = rate;
      return a;
    };
    const fin = async (a: Animation) => {
      try {
        await a.finished;
      } catch {
        /* cancelled */
      }
    };
    // waits in intro time (so fast-forward shortens them too)
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        let acc = 0,
          last = performance.now();
        const step = (t: number) => {
          acc += Math.max(0, t - last) * rate;
          last = t;
          if (acc >= ms || !flags.alive) res();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    // counter + progress line over ms of intro time
    const countTo = (ms: number) =>
      new Promise<void>((res) => {
        let acc = 0,
          last = performance.now();
        const step = (t: number) => {
          acc += Math.max(0, t - last) * rate;
          last = t;
          const e = 1 - Math.pow(1 - Math.min(1, acc / ms), 3);
          count.textContent = String(Math.round(100 * e)).padStart(3, "0");
          line.style.transform = `scaleX(${e.toFixed(4)})`;
          if (acc >= ms || !flags.alive) res();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    // resolves once the 3D stage has drawn a frame (or after ms)
    const glReady = (ms: number) =>
      new Promise<void>((res) => {
        const t0 = performance.now();
        const chk = () => (root.dataset.gl === "on" || performance.now() - t0 > ms || !flags.alive ? res() : requestAnimationFrame(chk));
        chk();
      });
    const speedUp = () => {
      if (rate !== 1) return;
      rate = 4;
      intro.getAnimations({ subtree: true }).forEach((a) => a.updatePlaybackRate(4));
      $("main").getAnimations().forEach((a) => a.updatePlaybackRate(4));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") speedUp();
    };
    intro.dataset.cursor = "Skip";
    intro.addEventListener("click", speedUp);
    window.addEventListener("keydown", onKey);
    const detach = () => {
      intro.removeEventListener("click", speedUp);
      window.removeEventListener("keydown", onKey);
    };
    ctx.cleanup(detach);
    intro.className = "intro v-c";

    /* ---------- planetrise ---------- */
    const W = innerWidth,
      H = innerHeight,
      mob = W <= 700;
    const HZ = H * (mob ? 0.58 : 0.62),
      R = Math.min(H * (mob ? 0.14 : 0.17), W * 0.26);
    // published before the 3D layer draws, so its very first frame already sits fully below the horizon;
    // 1.8R clears the orbit rings (they reach ~1.64R), so no ring edge peeks over the line
    const start: IntroPose = { x: 0, y: yFor(HZ + R * 1.8 + 12), s: scaleFor(R), shell: 1, op: 1, ex: 0, full: 1 };
    stage.pose(start);
    const layer = document.createElement("div");
    layer.className = "ix";
    intro.insertBefore(layer, bg.nextSibling);
    const mk = (cls: string) => {
      const d = document.createElement("div");
      d.className = cls;
      layer.append(d);
      return d;
    };
    const glow = mk("ix-hzglow"),
      ground = mk("ix-ground"),
      refl = mk("ix-refl"),
      hz = mk("ix-hz");
    [...letters, box].forEach((n) => (n.style.opacity = "0"));
    play(hz, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 1100, delay: 200, easing: ease.io, fill: "both" });
    play(meta, [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 400, easing: SOFT, fill: "both" });
    countTo(5000);
    await Promise.race([stage.ready, sleep(4000)]);
    if (!flags.alive) return;
    stage.setWarp(0.6, false);
    stage.pose(start, true);
    // the horizon draw covers 3D start-up; the planet only rises once a real frame has rendered
    await Promise.all([wait(900), glReady(4000)]);
    if (!flags.alive) return;
    stage.pose({ x: 0, y: yFor(Math.max(H * 0.1 + R, HZ - R - H * (mob ? 0.08 : 0.12))), s: scaleFor(R), shell: 1, op: 1, ex: 0, full: 1, rate: 0.03 });
    play(glow, [{ opacity: 0 }, { opacity: 1 }], { duration: 1800, delay: 200, easing: SOFT, fill: "both" });
    play(refl, [{ opacity: 0 }, { opacity: 1 }], { duration: 2000, delay: 500, easing: SOFT, fill: "both" });
    await wait(900);
    if (!flags.alive) return;
    // the name emerges downward out of the horizon
    letters.forEach((l, i) => {
      l.style.opacity = "";
      play(l, [{ transform: "translateY(-115%)" }, { transform: "none" }], { duration: 1100, delay: 45 * i, easing: SOFT, fill: "both" });
      play(l, [{ fontVariationSettings: '"wdth" 125, "wght" 150' }, { fontVariationSettings: restFvs(!!l.dataset.italic) }], { duration: 1400, delay: 45 * i, easing: SOFT, fill: "both" });
    });
    play(box, [{ transform: "translateY(-120%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 1100, delay: 180, easing: SOFT, fill: "both" });
    await wait(2300);
    if (!flags.alive) return;
    // the name retracts back into the horizon
    letters.forEach((l, i) => play(l, [{ transform: "none" }, { transform: "translateY(-115%)" }], { duration: 650, delay: 18 * i, easing: ease.io, fill: "forwards" }));
    play(box, [{ transform: "none", opacity: 1 }, { transform: "translateY(-120%)", opacity: 0 }], { duration: 650, easing: ease.io, fill: "forwards" });
    play(meta, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
    await wait(450);
    if (!flags.alive) return;
    // the ground sinks away and the orb sails to its hero pose
    stage.pose(stage.heroPose());
    play(ground, [{ transform: "none", opacity: 1 }, { transform: "translateY(45%)", opacity: 0 }], { duration: 900, easing: ease.io, fill: "forwards" });
    play(refl, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" });
    play(hz, [{ transform: "scaleX(1)", opacity: 1 }, { transform: "scaleX(1.6) translateY(30vh)", opacity: 0 }], { duration: 900, easing: ease.io, fill: "forwards" });
    play(glow, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, fill: "forwards" });
    await wait(700);
    if (!flags.alive) return;

    /* ---------- handoff: the page fades up underneath ---------- */
    stage.pose(null);
    stage.release();
    stage.intro(false);
    const mainEl = $("main"),
      header = $("header");
    delete root.dataset.intro;
    root.style.overflow = "";
    scroll.resume();
    enterPage();
    play(mainEl, [{ opacity: 0, filter: "blur(8px)", transform: "translateY(24px)" }, { opacity: 1, filter: "blur(0px)", transform: "none" }], { duration: 1400, easing: SOFT });
    play(header, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: 300, easing: SOFT, fill: "backwards" });
    await fin(play(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 1200, easing: SOFT, fill: "forwards" }));
    if (!flags.alive) return;

    detach();
    delete intro.dataset.cursor;
    intro.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    layer.remove();
    intro.className = "intro";
    letters.forEach((l) => (l.style.cssText = ""));
    [box, meta, line].forEach((n) => (n.style.opacity = ""));
    bg.style.opacity = "";
    flags.introRunning = false;
    rate = 1;
    cursor.refresh();
  }

  ctx.on($("[data-replay]"), "click", async () => {
    if (!S.on || flags.introRunning || flags.busy) return;
    scroll.jumpTo(0, true);
    await sleep(60);
    if (!flags.alive) return;
    root.dataset.intro = "playing";
    run();
  });

  return { run };
}
