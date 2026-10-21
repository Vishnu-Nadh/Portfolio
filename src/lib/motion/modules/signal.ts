import type { MotionContext } from "../context";
import { $, $$, lerpK, smoothRange } from "../utils";

/**
 * About "signal" (pinned): the statement lights up word by word as you scroll through the section,
 * then the gradient lines above the stats fill in one after another.
 */
export function createSignal(ctx: MotionContext) {
  const { root } = ctx;
  const sec = $(".hello");
  const words = $$(".hello__text .wd", sec);
  const bars = $$(".stat__line i", sec);
  const HL = { p: 0, top: 0, run: 0 };

  ctx.measureFns.add(() => {
    HL.top = sec.getBoundingClientRect().top + scrollY;
    HL.run = sec.offsetHeight - innerHeight;
  });

  ctx.frameFns.add((_now, k, y) => {
    const vh = innerHeight;
    if (!(y > HL.top - vh && y < HL.top + HL.run + vh)) return;
    const on = root.dataset.motion === "on";
    const pT = Math.min(1, Math.max(0, (y - HL.top + vh * 0.35) / Math.max(1, HL.run + vh * 0.2)));
    HL.p += (pT - HL.p) * (on ? lerpK(0.12, k) : 1);
    // a soft "read head" 3 words wide sweeps across the statement
    const head = HL.p * (words.length + 3);
    words.forEach((w, i) => w.style.setProperty("--lit", (0.16 + 0.84 * Math.min(1, Math.max(0, head - i) / 3)).toFixed(3)));
    const rp = smoothRange(0.55, 1, HL.p);
    bars.forEach((b, i) => {
      const t = Math.max(0, Math.min(1, rp * 1.3 - i * 0.15));
      b.style.transform = `scaleX(${t.toFixed(4)})`;
    });
  });
}
