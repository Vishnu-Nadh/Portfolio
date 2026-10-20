import type { MotionContext } from "../context";
import type { Cursor } from "./cursor";
import type { Glitch } from "./glitch";
import type { SmoothScroll } from "./smoothScroll";
import { $, $$, sleep } from "../utils";

export const INTRO_SEEN_KEY = "folio-intro";

const HOLD = "steps(1, end)";

/**
 * Preloader (datamosh): wordmark letters rise and flex their axes under a scanline while a counter
 * runs to 100; then the lockup tears apart into scattered shards and the screen dissolves in tiles,
 * revealing the page. Click / Esc fast-forwards (4x).
 */
export function createIntro(ctx: MotionContext, cursor: Cursor, scroll: SmoothScroll, glitch: Glitch, enterPage: () => void) {
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
      logo = $(".intro__logo", intro);
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
    glitch.introIn({ letters, logo });

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
        glitch.countTick(count, e);
        if (acc >= 1120) resolve();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (!flags.alive) return;

    // the lockup tears apart into scattered shards; the accent box shreds instead of taking over the screen
    glitch.introOut({ logo });
    letters.forEach((l, i) => play(l, [{ transform: "none" }, { transform: "translateY(-115%)" }], { duration: 420, delay: 14 * i, easing: ease.io, fill: "forwards" }));
    play(meta, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" });
    play(line, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" });
    glitch.frags(intro, { n: 34, dur: 640, rate });
    await fin(
      play(
        box,
        [
          { transform: "none", opacity: 1, easing: HOLD },
          { transform: "translateX(-14px) scaleX(1.5)", opacity: 1, offset: 0.25, easing: HOLD },
          { transform: "translateX(20px) scaleY(0.35)", opacity: 0.5, offset: 0.5, easing: HOLD },
          { transform: "translateX(-8px) scaleX(2.4) scaleY(0.1)", opacity: 1, offset: 0.75, easing: HOLD },
          { transform: "scaleX(3) scaleY(0)", opacity: 0 },
        ],
        { duration: 460, delay: 120, fill: "forwards" },
      ),
    );
    if (!flags.alive) return;

    // the screen dissolves in tiles over the page as it enters
    glitch.landing();
    const diss = glitch.dissolve(intro, { dur: 860, rate });
    bg.style.opacity = "0";
    root.style.overflow = "";
    scroll.resume();
    enterPage();
    play($("main"), [{ transform: "scale(1.04)", opacity: 0.5 }, { transform: "none", opacity: 1 }], { duration: 1000, easing: ease.out });
    glitch.frags(intro, { n: 20, dur: 520, delay: 160, rate });
    await diss;
    if (!flags.alive) return;

    glitch.landed();
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
