import type { MotionContext } from "../context";
import { $$, lerpK } from "../utils";

/**
 * 3D cards (skills panel + experience dock): pointer tilt on fine pointers, scroll sway everywhere,
 * and a glare + gradient edge that follow the cursor. Values are written as CSS variables (see _scene3d.scss).
 */
export function createTiltCards(ctx: MotionContext) {
  const { root } = ctx;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cards = $$(".c3d").map((el) => ({ el, rx: 0, ry: 0, gl: 0, gx: 50, gy: 50, trx: 0, try: 0, tgl: 0, tgx: 50, tgy: 50 }));
  let px = -1,
    py = -1,
    lastY = scrollY,
    vel = 0;
  if (fine)
    ctx.on(
      window,
      "pointermove",
      (e: PointerEvent) => {
        px = e.clientX;
        py = e.clientY;
      },
      { passive: true },
    );

  ctx.frameFns.add((_now, k, y) => {
    const on = root.dataset.motion === "on";
    vel += ((y - lastY) / k - vel) * lerpK(0.1, k);
    lastY = y;
    cards.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const inside = fine && px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
      const sway = Math.max(-5, Math.min(5, vel * -0.12));
      const mid = (r.top + r.height / 2) / innerHeight - 0.5;
      if (inside) {
        const nx = (px - r.left) / r.width - 0.5,
          ny = (py - r.top) / r.height - 0.5;
        s.try = nx * 14;
        s.trx = -ny * 12 + sway;
        s.tgl = 1;
        s.tgx = (nx + 0.5) * 100;
        s.tgy = (ny + 0.5) * 100;
      } else {
        s.try = 0;
        s.trx = sway + mid * -6;
        s.tgl = 0;
      }
      const a = on ? lerpK(0.1, k) : 1;
      s.rx += (s.trx - s.rx) * a;
      s.ry += (s.try - s.ry) * a;
      s.gl += (s.tgl - s.gl) * lerpK(0.08, k);
      s.gx += (s.tgx - s.gx) * lerpK(0.2, k);
      s.gy += (s.tgy - s.gy) * lerpK(0.2, k);
      const st = s.el.style;
      st.setProperty("--rx", on ? s.rx.toFixed(2) : "0");
      st.setProperty("--ry", on ? s.ry.toFixed(2) : "0");
      st.setProperty("--glr", s.gl.toFixed(3));
      st.setProperty("--gx", s.gx.toFixed(1) + "%");
      st.setProperty("--gy", s.gy.toFixed(1) + "%");
    });
  });
}
