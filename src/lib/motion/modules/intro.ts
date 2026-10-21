import type { MotionContext } from "../context";
import type { Cursor } from "./cursor";
import type { SmoothScroll } from "./smoothScroll";
import { $, $$, sleep } from "../utils";

export const INTRO_SEEN_KEY = "folio-intro";

/** gentle out-curve used throughout the intro: no hard cuts */
const SOFT = "cubic-bezier(.22,1,.36,1)";

/**
 * Galaxy intro: stars rush in and settle, the orb condenses at centre, the name surfaces through soft
 * focus while a counter runs to 100, then the lockup blurs away, the orb glides to its hero pose and the
 * page fades up underneath. Click / Esc fast-forwards (4x).
 */
export function createIntro(ctx: MotionContext, cursor: Cursor, scroll: SmoothScroll, stage: { intro: (v: boolean) => void }, enterPage: () => void) {
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

    // orb to centre stage, stars warp in
    stage.intro(true);
    letters.forEach((l, i) => {
      play(l, [{ transform: "translateY(40%)", opacity: 0, filter: "blur(14px)" }, { transform: "none", opacity: 1, filter: "blur(0px)" }], { duration: 1100, delay: 520 + 45 * i, easing: SOFT, fill: "both" });
      play(l, [{ fontVariationSettings: '"wdth" 125, "wght" 150' }, { fontVariationSettings: restFvs(!!l.dataset.italic) }], { duration: 1400, delay: 520 + 45 * i, easing: SOFT, fill: "both" });
    });
    play(box, [{ transform: "scale(.4)", opacity: 0, filter: "blur(10px)" }, { transform: "none", opacity: 1, filter: "blur(0px)" }], { duration: 1100, delay: 700, easing: SOFT, fill: "both" });
    play(meta, [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 600, easing: SOFT, fill: "both" });

    // counter + progress line, driven by accumulated (rate-scaled) time
    await new Promise<void>((resolve) => {
      let acc = 0,
        last = performance.now();
      const step = (t: number) => {
        if (!flags.alive) return resolve();
        acc += Math.max(0, t - last) * rate;
        last = t;
        const e = 1 - Math.pow(1 - Math.min(1, acc / 2200), 3);
        count.textContent = String(Math.round(100 * e)).padStart(3, "0");
        line.style.transform = `scaleX(${e.toFixed(4)})`;
        if (acc >= 2500) resolve();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (!flags.alive) return;

    // the lockup lifts away into soft focus
    letters.forEach((l, i) =>
      play(l, [{ transform: "none", opacity: 1, filter: "blur(0px)" }, { transform: "translateY(-30%)", opacity: 0, filter: "blur(12px)" }], { duration: 800, delay: 25 * i, easing: ease.io, fill: "forwards" }),
    );
    play(box, [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(10px)", transform: "scale(1.4)" }], { duration: 800, easing: ease.io, fill: "forwards" });
    play(meta, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" });
    await fin(play(line, [{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: "forwards" }));
    if (!flags.alive) return;

    // the orb glides to its hero pose (it follows html[data-intro]) while the page fades up underneath
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
