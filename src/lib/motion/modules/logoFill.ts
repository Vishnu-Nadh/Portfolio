import type { MotionContext } from "../context";
import { $, clamp, lerpK } from "../utils";

/** Header logo mark fills bottom-up with overall page scroll progress. */
export function createLogoFill(ctx: MotionContext) {
  const fill = $(".logo__fill");
  let p = 0,
    shown = "";

  ctx.frameFns.add((_now, k, y) => {
    const range = document.documentElement.scrollHeight - innerHeight;
    const target = !ctx.root.dataset.intro && range > 0 ? clamp(y / range) : 0;
    p += (target - p) * lerpK(0.2, k);
    const s = p.toFixed(4);
    if (s !== shown) {
      shown = s;
      fill.style.transform = `scaleY(${s})`;
    }
  });
}
