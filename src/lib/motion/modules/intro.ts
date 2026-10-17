import type { MotionContext } from "../context";
import type { Cursor } from "./cursor";
import type { SmoothScroll } from "./smoothScroll";
import { $, $$, sleep } from "../utils";

export const INTRO_SEEN_KEY = "folio-intro";

/**
 * Preloader: wordmark letters rise and flex their axes, a counter runs to 100,
 * the accent box scales over the screen and then shrinks into the header logo.
 * Click / Esc fast-forwards (4x).
 */
export function createIntro(ctx: MotionContext, cursor: Cursor, scroll: SmoothScroll, enterPage: () => void) {
  const { S, flags, root, ease } = ctx;
  const intro = $(".intro");
  let rate = 1;
  const restFvs = (italic: boolean) => (italic ? '"wdth" 110, "wght" 250' : '"wdth" 68, "wght" 850');

  async function run() {
    flags.introRunning = true;
    rate = 1;
    root.dataset.intro = "playing";
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* storage blocked */
    }
    root.style.overflow = "hidden";
    scroll.pause();

    const letters = $$(".intro__ch", intro),
      box = $(".intro__box", intro),
      glyph = $("[data-glyph]", intro);
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

    letters.forEach((l, i) => {
      play(l, [{ transform: "translateY(115%)" }, { transform: "none" }], { duration: 650, delay: 80 + 30 * i, easing: ease.out, fill: "both" });
      play(
        l,
        [
          { fontVariationSettings: '"wdth" 125, "wght" 150' },
          { fontVariationSettings: '"wdth" 62, "wght" 900', offset: 0.45 },
          { fontVariationSettings: restFvs(!!l.dataset.italic) },
        ],
        { duration: 750, delay: 100 + 22 * i, easing: "ease-in-out", fill: "both" },
      );
    });
    play(box, [{ transform: "scale(0) rotate(-90deg)" }, { transform: "none" }], { duration: 650, delay: 220, easing: ease.out, fill: "forwards" });
    play(meta, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 140, fill: "both" });

    // counter + progress line, driven by accumulated (rate-scaled) time
    await new Promise<void>((resolve) => {
      let acc = 0,
        last = performance.now();
      const step = (t: number) => {
        if (!flags.alive) return resolve();
        acc += Math.max(0, t - last) * rate;
        last = t;
        const e = 1 - Math.pow(1 - Math.min(1, acc / 1000), 3);
        count.textContent = String(Math.round(100 * e)).padStart(3, "0");
        line.style.transform = `scaleX(${e.toFixed(4)})`;
        if (acc >= 1120) resolve();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (!flags.alive) return;

    // exit the lockup, grow the accent box over the screen
    letters.forEach((l, i) => play(l, [{ transform: "none" }, { transform: "translateY(-115%)" }], { duration: 480, delay: 16 * i, easing: ease.io, fill: "forwards" }));
    play(meta, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
    play(line, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
    play(glyph, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 200, fill: "forwards" });
    const vw = innerWidth,
      vh = innerHeight;
    const bw = box.offsetWidth,
      bh = box.offsetHeight;
    const bx = box.offsetLeft + bw / 2,
      by = box.offsetTop + bh / 2; // layout centre (unaffected by transforms)
    const f = 1.15 * Math.max(vw / bw, vh / bh);
    const E = `translate(${vw / 2 - bx}px,${vh / 2 - by}px) scale(${f})`;
    await fin(play(box, [{ transform: "none" }, { transform: E }], { duration: 650, delay: 160, easing: ease.io, fill: "forwards" }));
    if (!flags.alive) return;

    // page starts underneath; box shrinks into the header mark
    bg.style.opacity = "0";
    root.style.overflow = "";
    scroll.resume();
    const tgt = $(".logo__mark").getBoundingClientRect();
    const T = `translate(${tgt.left + tgt.width / 2 - bx}px,${tgt.top + tgt.height / 2 - by}px) scale(${tgt.width / bw})`;
    const mainEl = $("main");
    enterPage();
    play(mainEl, [{ transform: "scale(1.06)", opacity: 0.4 }, { transform: "none", opacity: 1 }], { duration: 1100, easing: ease.out });
    play(glyph, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 480, fill: "forwards" });
    await fin(play(box, [{ transform: E }, { transform: T }], { duration: 750, easing: "cubic-bezier(.83,0,.17,1)", fill: "forwards" }));
    if (!flags.alive) return;

    detach();
    delete intro.dataset.cursor;
    delete root.dataset.intro;
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
