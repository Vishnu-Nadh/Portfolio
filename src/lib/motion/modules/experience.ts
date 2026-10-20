import { pad2 } from "@/lib/format";
import type { MotionContext } from "../context";
import { $, $$, clamp, lerpK } from "../utils";

export type ExperienceList = ReturnType<typeof createExperience>;

/**
 * Experience: scroll (or hover on desktop) picks the focused role; its summary panel crossfades
 * in the sticky dock, role titles morph width/weight, and the progress bar fills.
 */
export function createExperience(ctx: MotionContext) {
  const { S, mq, data } = ctx;
  const list = $("[data-list]");
  const rows = $$(".row", list);
  const names = rows.map((r) => $(".row__name", r));
  const layers = $$(".layer", $("[data-stage]"));
  const cur$ = $("[data-cur]"),
    plat$ = $("[data-plat]"),
    bar$ = $("[data-bar]");

  const W = {
    sec: $(".work"),
    col: $(".work__col"),
    focus: -1,
    hover: -1,
    t: rows.map(() => ({ t: 0, v: -1 })),
    prog: -1,
    secTop: 0,
    secH: 0,
    rowC: [] as { c: number; top: number }[],
  };

  rows.forEach((r, i) => {
    ctx.on(r, "mouseenter", () => {
      if (S.fine) {
        W.hover = i;
        r.classList.add("is-hot");
      }
    });
    ctx.on(r, "mouseleave", () => r.classList.remove("is-hot"));
    ctx.on(r, "focus", () => {
      if (r.matches(":focus-visible")) r.classList.add("is-hot");
    });
    ctx.on(r, "blur", () => r.classList.remove("is-hot"));
  });
  ctx.on(list, "mouseleave", () => (W.hover = -1));

  ctx.measureFns.add(() => {
    const sy = scrollY,
      r = W.sec.getBoundingClientRect();
    W.secTop = r.top + sy;
    W.secH = r.height;
    W.rowC = rows.map((n) => {
      const b = n.getBoundingClientRect();
      return { c: b.top + sy + b.height / 2, top: b.top + sy };
    });
  });

  function setFocus(i: number) {
    W.focus = i;
    layers.forEach((l, n) => l.classList.toggle("is-on", n === i));
    rows.forEach((r, n) => r.classList.toggle("is-focus", n === i));
    cur$.textContent = pad2(i + 1);
    plat$.textContent = data.experience.items[i].period;
  }

  ctx.frameFns.add((_now, k, y) => {
    const vh = innerHeight;
    if (!W.rowC.length) return;
    const near = y + vh > W.secTop - vh * 0.5 && y < W.secTop + W.secH;
    if (!near) return;

    // which role is "in focus" (on mobile the card scrub owns this)
    let idx = 0;
    if (mq.mobile.matches) idx = W.focus < 0 ? 0 : W.focus;
    else if (W.hover >= 0 && S.fine) idx = W.hover;
    else {
      const c = y + vh / 2;
      let best = Infinity;
      W.rowC.forEach((r, n) => {
        const d = Math.abs(r.c - c);
        if (d < best) {
          best = d;
          idx = n;
        }
      });
    }
    if (idx !== W.focus) setFocus(idx);

    // role title morph
    W.t.forEach((o, n) => {
      const target = +(n === idx);
      o.t = S.on ? o.t + (target - o.t) * lerpK(0.12, k) : target;
      if (Math.abs(target - o.t) < 0.003) o.t = target;
      if (Math.abs(o.t - o.v) >= 0.003) {
        o.v = o.t;
        names[n].style.fontVariationSettings = `"wdth" ${(88 + 30 * o.t).toFixed(1)}, "wght" ${(700 - 300 * o.t).toFixed(0)}`;
        names[n].style.opacity = (0.5 + 0.5 * o.t).toFixed(3);
      }
    });

    // progress through the list
    const first = W.rowC[0].c,
      last = W.rowC[W.rowC.length - 1].c;
    const p = clamp((y + vh / 2 - first) / (last - first || 1));
    if (Math.abs(p - W.prog) > 0.001) {
      W.prog = p;
      bar$.style.transform = `scaleX(${p.toFixed(4)})`;
    }
  });

  return { layers, col: W.col, setFocus, current: () => W.focus };
}
