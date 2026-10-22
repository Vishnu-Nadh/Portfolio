import type { MotionContext } from "../context";
import type { SmoothScroll } from "./smoothScroll";
import { $, lerpK } from "../utils";

const PAD = 14;

/**
 * Meteor scrollbar: the native bar is hidden (see _meteor.scss); the rail is the trajectory and the thumb
 * a meteor. Its tail stretches with scroll speed and points back along the path, the travelled path stays
 * faintly burnt, and fast scrolling throws sparks. Click or drag the rail to jump.
 */
export function createMeteor(ctx: MotionContext, scroll: SmoothScroll) {
  const { root } = ctx;
  const rail = $("[data-mtr]"),
    m = $("[data-mm]"),
    tail = $("[data-mtail]"),
    burn = $("[data-mburn]");
  let lastY = scrollY,
    vel = 0,
    shown = 0,
    idle = 0,
    drag = false,
    sparkT = 0;
  const maxY = () => Math.max(1, root.scrollHeight - innerHeight);
  const track = () => innerHeight - PAD * 2;
  const jump = (cy: number) => scroll.jumpTo(Math.min(1, Math.max(0, (cy - PAD) / track())) * maxY(), true);

  ctx.on(rail, "pointerdown", (e: PointerEvent) => {
    drag = true;
    rail.classList.add("is-drag");
    rail.setPointerCapture(e.pointerId);
    jump(e.clientY);
    e.preventDefault();
  });
  ctx.on(rail, "pointermove", (e: PointerEvent) => {
    if (drag) jump(e.clientY);
  });
  const end = () => {
    drag = false;
    rail.classList.remove("is-drag");
  };
  ctx.on(rail, "pointerup", end);
  ctx.on(rail, "pointercancel", end);

  function spark(px: number, py: number) {
    const s = document.createElement("span");
    s.className = "mtr__spark";
    s.style.left = px + "px";
    s.style.top = py + "px";
    rail.append(s);
    const dx = (Math.random() - 0.5) * 14,
      dy = (vel > 0 ? -1 : 1) * (6 + Math.random() * 16);
    s.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.3)`, opacity: 0 }], {
      duration: 500 + Math.random() * 400,
      easing: "cubic-bezier(.16,1,.3,1)",
    }).onfinish = () => s.remove();
  }

  ctx.frameFns.add((_now, k, y) => {
    const on = root.dataset.motion === "on";
    const d = (y - lastY) / k;
    lastY = y;
    vel += (d - vel) * lerpK(0.18, k);
    const target = PAD + Math.min(1, Math.max(0, y / maxY())) * track();
    shown += (target - shown) * (on ? lerpK(0.35, k) : 1);
    m.style.transform = `translate3d(0,${shown.toFixed(2)}px,0)`;
    burn.style.height = Math.max(0, shown - PAD).toFixed(1) + "px";
    const speed = Math.min(1, Math.abs(vel) / 45);
    tail.style.height = (on ? 14 + speed * 150 : 14).toFixed(1) + "px";
    tail.style.transform = vel < -0.3 ? "rotate(180deg)" : "none";
    tail.style.opacity = (0.35 + speed * 0.65).toFixed(3);
    if (Math.abs(vel) > 2) idle = 0;
    else idle += k;
    rail.classList.toggle("is-live", idle < 50);
    sparkT += k;
    if (on && speed > 0.25 && sparkT > 3 / speed) {
      sparkT = 0;
      spark(rail.clientWidth - 10.5, shown);
    }
  });
}
