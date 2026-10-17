import type { MotionContext } from "../context";
import { $$, lerpK } from "../utils";

/** [data-magnet] elements lean toward the pointer when it comes close. */
export function createMagnets(ctx: MotionContext) {
  const { S } = ctx;
  const magnets = $$("[data-magnet]").map((n) => ({ n, x: 0, y: 0 }));

  ctx.frameFns.add((_now, k) => {
    if (!S.on || !S.fine) return;
    const rate = lerpK(0.15, k);
    magnets.forEach((m) => {
      const r = m.n.getBoundingClientRect();
      const cx = r.left + r.width / 2 - m.x,
        cy = r.top + r.height / 2 - m.y;
      const ox = S.px - cx,
        oy = S.py - cy;
      const near = S.inside && Math.abs(ox) < r.width / 2 + 50 && Math.abs(oy) < r.height / 2 + 50;
      const tx = near ? ox * 0.35 : 0,
        ty = near ? oy * 0.35 : 0;
      m.x += (tx - m.x) * rate;
      m.y += (ty - m.y) * rate;
      if (near || Math.abs(m.x - tx) + Math.abs(m.y - ty) > 0.05) m.n.style.transform = `translate3d(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px,0)`;
    });
  });

  return {
    reset() {
      magnets.forEach((m) => (m.n.style.transform = ""));
    },
  };
}
