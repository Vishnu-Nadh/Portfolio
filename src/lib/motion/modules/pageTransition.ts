import type { MotionContext } from "../context";
import type { Cursor } from "./cursor";
import type { SmoothScroll } from "./smoothScroll";
import type { Stage } from "./scene3d";
import { $, el, nextFrame, sleep } from "../utils";

export type PageTransition = ReturnType<typeof createPageTransition>;

// fall in (accelerating), burst out (decelerating), and a symmetric curve for the label line
const IN = "cubic-bezier(.55,0,.85,.35)",
  OUT = "cubic-bezier(.16,1,.3,1)",
  IO = "cubic-bezier(.65,0,.35,1)";

/**
 * Wormhole transition: the page spirals down into the click point while a dark void opens from it,
 * the destination label resolves at the bottom of the throat, then a bright exit flashes and the new
 * view settles from oversized to rest.
 */
export function createPageTransition(ctx: MotionContext, cursor: Cursor, scroll: SmoothScroll, stage: Stage) {
  const { S, flags } = ctx;
  const trans = $(".trans");
  const voidEl = $(".trans__void");
  const core = $(".trans__core");
  const tLabel = $(".trans__label");
  const tMeta = $(".trans__meta");
  const tSub = $(".trans__sub");
  const tLine = $(".trans__line");

  function buildLabel(text: string) {
    tLabel.textContent = "";
    const chars: HTMLElement[] = [];
    text.split(" ").forEach((w) => {
      const word = el("span", "trans__word");
      [...w].forEach((c) => {
        const clip = el("span", "trans__clip");
        const ch = el("span", "trans__ch", c);
        clip.append(ch);
        word.append(clip);
        chars.push(ch);
      });
      tLabel.append(word);
    });
    return chars;
  }

  async function go(label: string, sub: string, action: () => void) {
    if (flags.busy) return;
    if (!S.on) {
      action();
      return;
    }
    flags.busy = true;
    cursor.over(null);
    scroll.pause();
    const chars = buildLabel(label);
    tSub.textContent = sub;
    const mainEl = $("main");
    // the wormhole opens where you clicked (centre for keyboard)
    const px = S.px > 0 ? S.px : innerWidth / 2,
      py = S.py > 0 ? S.py : innerHeight / 2;
    trans.style.visibility = "visible";
    stage.warp(1);

    /* 1. the fall: the page twists into the throat */
    mainEl.style.transformOrigin = `${px}px ${py + scrollY}px`;
    mainEl.animate(
      [
        { transform: "none", filter: "blur(0px)", opacity: 1 },
        { transform: "scale(.12) rotate(-38deg)", filter: "blur(14px)", opacity: 0 },
      ],
      { duration: 820, easing: IN, fill: "forwards" },
    );
    voidEl.animate([{ clipPath: `circle(0% at ${px}px ${py}px)` }, { clipPath: `circle(150% at ${px}px ${py}px)` }], {
      duration: 900,
      delay: 120,
      easing: "cubic-bezier(.7,0,.3,1)",
      fill: "forwards",
    });

    /* 2. the throat: the label resolves far below */
    chars.forEach((c, i) =>
      c.animate(
        [
          { transform: "scale(.2) translateZ(0)", filter: "blur(12px)", opacity: 0 },
          { transform: "none", filter: "blur(0px)", opacity: 1 },
        ],
        { duration: 780, delay: 560 + 16 * i, easing: OUT, fill: "both" },
      ),
    );
    tMeta.animate([{ opacity: 0, transform: "scale(.8)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 640, easing: OUT, fill: "both" });
    tLine.style.transformOrigin = "center";
    tLine.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 800, delay: 600, easing: IO, fill: "both" });

    await sleep(1380);
    if (!flags.alive) return;
    mainEl.getAnimations().forEach((a) => a.cancel());
    mainEl.style.opacity = "0";
    action();
    await nextFrame();
    if (!flags.alive) return;

    /* 3. the exit: a white-hot mouth opens and throws you out the other side */
    chars.forEach((c, i) =>
      c.animate(
        [
          { transform: "none", filter: "blur(0px)", opacity: 1 },
          { transform: "scale(2.4)", filter: "blur(16px)", opacity: 0 },
        ],
        { duration: 520, delay: 4 * i, easing: IN, fill: "forwards" },
      ),
    );
    tMeta.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" });
    tLine.animate([{ transform: "scaleX(1)", opacity: 1 }, { transform: "scaleX(3)", opacity: 0 }], { duration: 480, easing: IN, fill: "forwards" });
    core.animate(
      [
        { opacity: 0, transform: "translate(-50%,-50%) scale(.05)" },
        { opacity: 0.55, transform: "translate(-50%,-50%) scale(1)", offset: 0.4 },
        { opacity: 0, transform: "translate(-50%,-50%) scale(9)" },
      ],
      { duration: 1000, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" },
    );
    mainEl.style.opacity = "";
    mainEl.style.transformOrigin = `50% ${scrollY + innerHeight / 2}px`;
    mainEl.animate(
      [
        { transform: "scale(1.9) rotate(14deg)", filter: "blur(18px)", opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: "none", filter: "blur(0px)", opacity: 1 },
      ],
      { duration: 1300, delay: 260, easing: OUT, fill: "backwards" },
    );
    const out = voidEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 640, delay: 300, easing: IO, fill: "forwards" });
    try {
      await out.finished;
    } catch {
      /* cancelled */
    }
    await sleep(120);

    trans.style.visibility = "hidden";
    [voidEl, core, ...chars, tMeta, tLine].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    const originTimer = window.setTimeout(() => (mainEl.style.transformOrigin = ""), 1500);
    ctx.cleanup(() => clearTimeout(originTimer));
    flags.busy = false;
    scroll.resume();
    cursor.refresh();
  }

  return { go };
}
