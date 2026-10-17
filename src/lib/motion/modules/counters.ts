import type { MotionContext } from "../context";
import { clamp } from "../utils";

export type Counters = ReturnType<typeof createCounters>;

/** Count-up numbers (expo-out over 1.8s). */
export function createCounters(ctx: MotionContext) {
  let active: { n: HTMLElement; to: number; t0: number }[] = [];

  ctx.frameFns.add((now) => {
    if (!active.length) return;
    active = active.filter((c) => {
      const p = clamp((now - c.t0) / 1800),
        e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      c.n.textContent = String(Math.round(c.to * e));
      return p < 1;
    });
  });

  return {
    start(n: HTMLElement) {
      active.push({ n, to: Number(n.dataset.count) || 0, t0: performance.now() });
    },
  };
}
