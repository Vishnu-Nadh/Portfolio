import type { MotionContext } from "../context";
import type { Counters } from "./counters";
import { $$ } from "../utils";

export type Reveals = ReturnType<typeof createReveals>;

/** Scroll-triggered entrances: [data-reveal] fade-up, [data-words] word cascade, [data-count] counters. */
export function createReveals(ctx: MotionContext, counters: Counters) {
  const { S, ease } = ctx;
  let io: IntersectionObserver | null = null;
  let wio: IntersectionObserver | null = null;
  let cio: IntersectionObserver | null = null;

  const revealOnce = (n: HTMLElement, delay = 0) => {
    if (!S.on) {
      n.style.opacity = "";
      return;
    }
    const a = n.animate([{ opacity: 0, transform: "translateY(48px)" }, { opacity: 1, transform: "none" }], { duration: 1100, delay, easing: ease.out, fill: "both" });
    a.onfinish = () => a.cancel();
    n.style.opacity = "";
  };

  const wordsIn = (p: HTMLElement) => {
    p.classList.add("is-in");
    if (!S.on) return;
    $$(".wd", p).forEach((w, i) => {
      const rest = getComputedStyle(w).fontVariationSettings;
      w.animate(
        [
          { transform: "translateY(110%)", fontVariationSettings: '"wdth" 125, "wght" 200' },
          { transform: "none", fontVariationSettings: rest },
        ],
        { duration: 1200, delay: 40 * i, easing: ease.out, fill: "backwards" },
      );
    });
  };

  function disconnect() {
    io?.disconnect();
    wio?.disconnect();
    cio?.disconnect();
    io = wio = cio = null;
  }

  function setUp() {
    disconnect();
    if (!S.on) {
      $$("[data-reveal]").forEach((n) => (n.style.opacity = ""));
      $$("[data-words]").forEach((p) => p.classList.add("is-in"));
      $$("[data-count]").forEach((n) => (n.textContent = n.dataset.count ?? ""));
      return;
    }
    const vh = innerHeight;
    const revealIo = (io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            revealOnce(e.target as HTMLElement);
            revealIo.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    ));
    let stagger = 0;
    $$("[data-reveal]").forEach((n) => {
      if (n.dataset.done) return;
      n.dataset.done = "1";
      const top = n.getBoundingClientRect().top;
      if (top < vh * 0.92 && top > -vh) revealOnce(n, 300 + 70 * stagger++);
      else {
        n.style.opacity = "0";
        revealIo.observe(n);
      }
    });

    const wordsIo = (wio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            wordsIo.unobserve(e.target);
            wordsIn(e.target as HTMLElement);
          }
        }),
      { rootMargin: "0px 0px -12% 0px" },
    ));
    $$("[data-words]:not(.is-in)").forEach((p) => wordsIo.observe(p));

    const countIo = (cio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            countIo.unobserve(e.target);
            counters.start(e.target as HTMLElement);
          }
        }),
      { rootMargin: "0px 0px -15% 0px" },
    ));
    $$("[data-count]").forEach((n) => {
      n.textContent = "0";
      countIo.observe(n);
    });
  }

  ctx.cleanup(disconnect);
  return { setUp };
}
