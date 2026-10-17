import Lenis from "lenis";
import type { MotionContext } from "../context";

export type SmoothScroll = ReturnType<typeof createSmoothScroll>;

/** Lenis smooth scrolling, driven manually from the engine ticker (autoRaf off). */
export function createSmoothScroll(ctx: MotionContext) {
  let lenis: Lenis | null = null;

  const api = {
    get lenis() {
      return lenis;
    },
    start() {
      if (lenis || !ctx.S.on) return;
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true, autoRaf: false });
    },
    destroy() {
      lenis?.destroy();
      lenis = null;
    },
    pause() {
      lenis?.stop();
    },
    resume() {
      lenis?.start();
    },
    jumpTo(y: number, immediate = false) {
      if (lenis) {
        lenis.scrollTo(
          y,
          immediate
            ? { immediate: true, force: true }
            : { duration: 1.4, easing: (x: number) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2) },
        );
      } else {
        window.scrollTo({ top: y, behavior: immediate || !ctx.S.on ? "auto" : "smooth" });
      }
    },
    /** Document Y of a nav target ("top" or a section id). */
    targetY(name: string) {
      if (name === "top") return 0;
      const n = document.getElementById(name);
      return n ? Math.max(0, n.getBoundingClientRect().top + scrollY) : 0;
    },
  };

  ctx.cleanup(api.destroy);
  return api;
}
