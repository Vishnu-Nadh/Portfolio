import { pad2 } from "@/lib/format";
import type { MotionContext } from "../context";
import { $, $$, clamp, easeOutQuart, lerpK } from "../utils";

/**
 * Selected work: scroll/hover picks the focused project, row titles morph,
 * the progress bar fills, and the floating card docks in the sticky frame
 * or lifts off to trail the pointer while a row is hovered.
 */
export function createWork(ctx: MotionContext) {
  const { S, mq, data } = ctx;
  const list = $("[data-list]");
  const rows = $$<HTMLAnchorElement>(".row", list);
  const names = rows.map((r) => $(".row__name", r));
  const card = $(".card");
  const stage = $("[data-stage]");
  const layers = $$(".layer", card);
  const stageLayers = $$(".layer", stage);
  const cur$ = $("[data-cur]"),
    ghost$ = $("[data-ghost]"),
    plat$ = $("[data-plat]"),
    bar$ = $("[data-bar]");

  const W = {
    sec: $(".work"),
    frame: $("[data-dockframe]"),
    col: $(".work__col"),
    focus: -1,
    hover: -1,
    t: rows.map(() => ({ t: 0, v: -1 })),
    lift: 0,
    from: 0,
    t0: 0,
    dur: 600,
    trail: false,
    x: 0,
    y: 0,
    shown: null as boolean | null,
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
  ctx.on(W.frame, "click", () => {
    if (W.focus >= 0) rows[W.focus].click();
  });

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
    stageLayers.forEach((l, n) => l.classList.toggle("is-on", n === i));
    rows.forEach((r, n) => r.classList.toggle("is-focus", n === i));
    cur$.textContent = ghost$.textContent = pad2(i + 1);
    plat$.textContent = data.projects[i].platform;
  }

  ctx.frameFns.add((now, k, y) => {
    const vh = innerHeight;
    if (!W.rowC.length) return;
    const near = y + vh > W.secTop - vh * 0.5 && y < W.secTop + W.secH;
    if (!near) return;
    const mobile = mq.mobile.matches;

    // which project is "in focus"
    let idx = 0;
    if (W.hover >= 0 && S.fine && !mobile) idx = W.hover;
    else {
      let c = y + vh / 2;
      if (mobile) c = (y + W.col.getBoundingClientRect().bottom + y + vh) / 2;
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

    // row title morph
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

    // floating card
    if (mobile) {
      card.style.opacity = "0";
      W.shown = null;
      return;
    }
    if (W.shown !== true) {
      W.shown = true;
      card.style.opacity = "1";
    }
    const fr = W.frame.getBoundingClientRect();
    const fx = fr.left + fr.width / 2,
      fy = fr.top + fr.height / 2;
    const trail = S.on && S.fine && W.hover >= 0;
    if (trail !== W.trail) {
      W.trail = trail;
      W.from = W.lift;
      W.t0 = now;
      W.dur = trail ? 600 : 900;
      if (trail) {
        W.x = S.px;
        W.y = S.py;
      }
    }
    W.lift = W.from + ((trail ? 1 : 0) - W.from) * easeOutQuart(clamp((now - W.t0) / W.dur));
    const px0 = W.x;
    W.x += (S.px - W.x) * lerpK(0.1, k);
    W.y += (S.py - W.y) * lerpK(0.1, k);
    const tilt = clamp(((W.x - px0) / k) * 0.6, -12, 12);
    const tx = fx + (clamp(W.x + 200, 180, innerWidth - 180) - fx) * W.lift;
    const ty = fy + (clamp(W.y, 220, vh - 220) - fy) * W.lift;
    const base = fr.width / 320;
    const sc = base + (1 - base) * W.lift;
    card.style.transform = `translate3d(${(tx - 160).toFixed(1)}px,${(ty - 200).toFixed(1)}px,0) rotate(${(tilt * W.lift).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
  });
}
