import type { MotionContext } from "../context";
import { $, clamp } from "../utils";

/** Endless marquee that speeds up and skews with scroll velocity. */
export function createMarquee(ctx: MotionContext) {
  const { S } = ctx;
  const track = $("[data-marquee]");
  const mq = { x: 0, top: 0, h: 0, half: 0 };

  ctx.measureFns.add(() => {
    const p = track.parentElement!.getBoundingClientRect();
    mq.top = p.top + scrollY;
    mq.h = p.height;
    mq.half = track.scrollWidth / 2;
  });

  ctx.frameFns.add((_now, k, y) => {
    if (!S.on || mq.top - y >= innerHeight || mq.top + mq.h - y <= 0) return;
    mq.x -= (0.7 + Math.min(0.35 * Math.abs(S.vel), 30)) * k;
    if (mq.half && -mq.x > mq.half) mq.x += mq.half;
    const sk = clamp(-0.25 * S.vel, -10, 10);
    track.style.transform = `translate3d(${mq.x.toFixed(1)}px,0,0) skewX(${sk.toFixed(2)}deg)`;
  });

  return {
    reset() {
      track.style.transform = "";
    },
  };
}
