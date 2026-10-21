import type { MotionContext } from "../context";
import { $, lerpK, smoothRange } from "../utils";

/**
 * Contact "event horizon": the accretion disk grows in (--hp) as the footer arrives, and publishes
 * where the 3D orb should sit (the disk centre, at the final scroll position) for the foot pose.
 */
export function createHorizon(ctx: MotionContext) {
  const { root } = ctx;
  const hz = $("[data-hz]");
  const foot = $(".foot");
  let hp = 0;

  ctx.measureFns.add(() => {
    const H = innerHeight;
    const r = hz.getBoundingClientRect(),
      maxY = document.documentElement.scrollHeight - H;
    // undo the current scale so the anchor matches the fully-grown disk
    const w = r.width / (0.72 + 0.28 * hp);
    ctx.anchors.foot = { x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY - maxY, d: w * 0.26 };
  });

  ctx.frameFns.add((_now, k) => {
    const on = root.dataset.motion === "on";
    const t = smoothRange(innerHeight, innerHeight * 0.25, foot.getBoundingClientRect().top);
    hp += (t - hp) * (on ? lerpK(0.08, k) : 1);
    hz.style.setProperty("--hp", hp.toFixed(3));
  });
}
