import type { MotionContext } from "../context";
import { $, clamp, lerpK } from "../utils";

/**
 * "Up close" strip: horizontal position is scrubbed by page scroll,
 * plus pointer drag with inertia. Falls back to native overflow scroll
 * (snap) on touch / reduced motion via html[data-scrub].
 */
export function createCloseStrip(ctx: MotionContext) {
  const { S } = ctx;
  const CL = {
    wrap: $("[data-closewrap]"),
    track: $("[data-closetrack]"),
    x: 0, off: 0, v: 0,
    drag: false, moved: false,
    sx: 0, o0: 0, lx: 0,
    top: 0, h: 0, over: 0,
  };

  ctx.measureFns.add(() => {
    const r = CL.wrap.getBoundingClientRect(),
      cs = getComputedStyle(CL.wrap);
    const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    CL.top = r.top + scrollY;
    CL.h = r.height;
    CL.over = Math.max(0, CL.track.scrollWidth - (CL.wrap.clientWidth - pad));
  });

  ctx.on(CL.wrap, "pointerdown", (e: PointerEvent) => {
    if (!(S.on && S.fine) || e.button !== 0) return;
    Object.assign(CL, { drag: true, sx: e.clientX, o0: CL.off, lx: e.clientX, moved: false, v: 0 });
  });
  ctx.on(
    window,
    "pointermove",
    (e: PointerEvent) => {
      if (!CL.drag) return;
      const dx = e.clientX - CL.sx;
      if (Math.abs(dx) > 6) CL.moved = true;
      CL.off = CL.o0 - dx;
      CL.v = -(e.clientX - CL.lx);
      CL.lx = e.clientX;
    },
    { passive: true },
  );
  const endDrag = () => {
    if (CL.drag) {
      CL.drag = false;
      setTimeout(() => (CL.moved = false), 0);
    }
  };
  ctx.on(window, "pointerup", endDrag);
  ctx.on(window, "pointercancel", endDrag);
  // swallow the click that ends a drag
  ctx.on(
    window,
    "click",
    (e: MouseEvent) => {
      if (CL.moved && CL.wrap.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );

  ctx.frameFns.add((_now, k, y) => {
    if (!(S.on && S.fine) || CL.top - y > innerHeight || CL.top + CL.h - y < 0) return;
    const p = clamp((y + innerHeight - CL.top) / (innerHeight + CL.h));
    if (!CL.drag) {
      CL.off += CL.v * k;
      CL.v *= Math.pow(0.92, k);
      if (Math.abs(CL.v) < 0.05) CL.v = 0;
    }
    let d = p * CL.over + CL.off;
    if (d < 0) {
      CL.off -= d;
      d = 0;
    } else if (d > CL.over) {
      CL.off -= d - CL.over;
      d = CL.over;
    }
    CL.x += (d - CL.x) * lerpK(0.2, k);
    const sk = clamp(-0.25 * S.vel + 0.15 * CL.v, -3, 3);
    CL.track.style.transform = `translate3d(${(-CL.x).toFixed(1)}px,0,0) skewX(${sk.toFixed(2)}deg)`;
  });

  return {
    reset() {
      CL.track.style.transform = "";
    },
  };
}
