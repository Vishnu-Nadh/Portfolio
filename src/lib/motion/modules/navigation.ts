import type { NavTarget } from "@/types/portfolio";
import type { MotionContext } from "../context";
import type { PageTransition } from "./pageTransition";
import type { SmoothScroll } from "./smoothScroll";
import { $ } from "../utils";

/** [data-nav] links play the page transition and jump; [data-totop] scrolls home. */
export function createNavigation(ctx: MotionContext, scroll: SmoothScroll, transition: PageTransition) {
  const { flags, data } = ctx;

  ctx.on(document, "click", (e: MouseEvent) => {
    const a = (e.target as Element)?.closest?.<HTMLElement>("[data-nav]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const name = a.dataset.nav as NavTarget;
    const [label, sub] = data.transitions[name];
    if (flags.introRunning || flags.busy) return;
    if (Math.abs(scroll.targetY(name) - scrollY) < 8) {
      scroll.jumpTo(0, false);
      return;
    }
    transition.go(label, sub, () => scroll.jumpTo(scroll.targetY(name), true));
  });

  ctx.on($("[data-totop]"), "click", () => scroll.jumpTo(0, false));
}
