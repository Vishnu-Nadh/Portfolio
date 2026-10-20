import type { MotionContext } from "../context";
import type { Cursor } from "./cursor";
import type { SmoothScroll } from "./smoothScroll";
import { $ } from "../utils";

interface Resettable {
  reset(): void;
}

interface MotionToggleDeps {
  cursor: Cursor;
  scroll: SmoothScroll;
  /** Everything that must snap back to rest when motion is paused. */
  resettables: Resettable[];
  setUpReveals: () => void;
  queueMeasure: () => void;
}

/** "(Pause motion)" button + live prefers-reduced-motion changes. */
export function createMotionToggle(ctx: MotionContext, deps: MotionToggleDeps) {
  const { S, root, mq, data } = ctx;
  const { cursor, scroll } = deps;
  const pauseBtn = $("[data-pause]");

  /** html[data-scrub] switches the close-up strip between scrubbed and native scroll. */
  const syncScrub = () => {
    root.dataset.scrub = S.on && S.fine ? "on" : "off";
  };

  function setMotion(on: boolean) {
    S.on = on;
    root.dataset.motion = on ? "on" : "off";
    pauseBtn.textContent = on ? data.experience.pause : data.experience.play;
    if (!on) {
      scroll.destroy();
      deps.resettables.forEach((r) => r.reset());
      cursor.hide();
    } else {
      scroll.start();
      cursor.show();
    }
    cursor.syncNative();
    syncScrub();
    deps.setUpReveals();
    deps.queueMeasure();
  }

  ctx.on(pauseBtn, "click", () => setMotion(!S.on));
  ctx.on(mq.reduce, "change", (e: MediaQueryListEvent) => setMotion(!e.matches));

  return { setMotion, syncScrub };
}
