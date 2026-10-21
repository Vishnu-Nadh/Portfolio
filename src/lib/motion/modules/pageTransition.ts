import type { MotionContext } from "../context";
import type { Cursor } from "./cursor";
import type { SmoothScroll } from "./smoothScroll";
import { $, $$, el, nextFrame, sleep } from "../utils";

export type PageTransition = ReturnType<typeof createPageTransition>;

/** Accent bars wipe up with a big kinetic label, the action runs underneath, then everything wipes away. */
export function createPageTransition(ctx: MotionContext, cursor: Cursor, scroll: SmoothScroll) {
  const { S, flags, ease } = ctx;
  const trans = $(".trans");
  const bars = $$(".trans__bar");
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
    trans.style.visibility = "visible";
    const mainEl = $("main");

    bars.forEach((b, i) =>
      b.animate([{ transform: "translateY(101%)" }, { transform: "translateY(0)" }], { duration: 300, delay: 22 * i, easing: ease.io, fill: "forwards" }),
    );
    mainEl.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-10vh)", opacity: 0.3 }], { duration: 380, easing: ease.io, fill: "forwards" });
    chars.forEach((c, i) =>
      c.animate(
        [
          { transform: "translateY(110%)", fontVariationSettings: '"wdth" 125, "wght" 200' },
          { transform: "none", fontVariationSettings: '"wdth" 70, "wght" 800' },
        ],
        { duration: 360, delay: 110 + 9 * i, easing: ease.out, fill: "both" },
      ),
    );
    tMeta.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 220, delay: 140, easing: ease.out, fill: "both" });
    tLine.style.transformOrigin = "left";
    tLine.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 380, delay: 130, easing: ease.io, fill: "both" });

    await sleep(300 + 4 * 22 + 200);
    if (!flags.alive) return;
    action();
    await sleep(260);
    await nextFrame();
    if (!flags.alive) return;

    chars.forEach((c, i) => c.animate([{ transform: "none" }, { transform: "translateY(-110%)" }], { duration: 280, delay: 8 * i, easing: ease.io, fill: "forwards" }));
    tMeta.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" });
    tLine.style.transformOrigin = "right";
    tLine.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: 260, easing: ease.io, fill: "forwards" });
    mainEl.getAnimations().forEach((a) => a.cancel());
    mainEl.animate([{ transform: "translateY(14vh)" }, { transform: "none" }], { duration: 560, delay: 60, easing: ease.out });
    const outs = bars.map((b, i) =>
      b.animate([{ transform: "translateY(0)" }, { transform: "translateY(-101%)" }], { duration: 340, delay: 40 + 22 * i, easing: ease.io, fill: "forwards" }),
    );
    try {
      await outs[outs.length - 1].finished;
    } catch {
      /* cancelled */
    }

    trans.style.visibility = "hidden";
    [...bars, ...chars, tMeta, tLine].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    flags.busy = false;
    scroll.resume();
    cursor.refresh();
  }

  return { go };
}
