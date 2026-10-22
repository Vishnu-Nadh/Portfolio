import type { MotionContext } from "../context";
import { $, $$, clamp, el, fvsLetter, lerpK, smooth } from "../utils";

export type KineticType = ReturnType<typeof createKineticType>;

interface KLine {
  line: HTMLElement;
  /** gradient underline under the last line; tracks the line's live width */
  ul: HTMLElement | null;
  els: HTMLElement[];
  chars: string[];
  /** target heat per letter */
  t: number[];
  /** last applied value per letter */
  v: number[];
  cx: number[];
  cy: number[];
  /** cumulative width deltas per letter (em) */
  w: Float32Array[];
  room: number;
  base: number;
  fs: number;
}

const KRADIUS = 420;
const STEPS = 16;

/**
 * Hero name: each letter widens and thins as the pointer nears it
 * (Archivo wdth/wght axes), while the line is constrained to fit its container.
 */
export function createKineticType(ctx: MotionContext) {
  const { S } = ctx;
  const tablet = ctx.mq.tablet;
  const heroEl = $(".hero__name");
  const klines: KLine[] = $$(".hero__line", heroEl).map((line) => {
    const els = $$(".kl", line);
    return { line, ul: line.querySelector<HTMLElement>(".hero__ul"), els, chars: els.map((n) => n.dataset.ch ?? ""), t: els.map(() => 0), v: els.map(() => 0), cx: [], cy: [], w: [], room: 0, base: 0, fs: 0 };
  });
  // char -> { base width (em), cumulative width delta for each axis step (em) }
  const widthCache = new Map<string, { base: number; d: Float32Array }>();

  function measureChars(chars: string[]) {
    const todo = [...new Set(chars)].filter((c) => !widthCache.has(c));
    if (!todo.length) return;
    const box = el("span");
    box.setAttribute("aria-hidden", "true");
    box.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font-size:100px;line-height:1;pointer-events:none";
    todo.forEach((c) => {
      for (let s = 0; s <= STEPS; s++) {
        const n = el("span", "kl");
        n.dataset.ch = c;
        n.style.fontVariationSettings = fvsLetter(s / STEPS);
        box.append(n);
      }
    });
    document.body.append(box);
    todo.forEach((c, ci) => {
      const ns = [...box.children].slice(ci * (STEPS + 1), ci * (STEPS + 1) + STEPS + 1);
      const w0 = ns[0].getBoundingClientRect().width;
      const d = new Float32Array(STEPS + 1);
      for (let s = 1; s <= STEPS; s++) d[s] = Math.max(d[s - 1], (ns[s].getBoundingClientRect().width - w0) / 100);
      widthCache.set(c, { base: w0 / 100, d });
    });
    box.remove();
  }

  const sample = (d: Float32Array, x: number) => {
    const p = clamp(x) * STEPS,
      i = Math.min(Math.floor(p), STEPS - 1);
    return d[i] + (d[i + 1] - d[i]) * (p - i);
  };

  function applyLine(L: KLine, force = false) {
    let s = 1;
    const total = (m: number) => {
      let sum = 0;
      for (let i = 0; i < L.t.length; i++) sum += sample(L.w[i], L.t[i] * m);
      return sum;
    };
    if (total(1) > L.room) {
      let lo = 0,
        hi = 1;
      for (let n = 0; n < 12; n++) {
        const mid = (lo + hi) / 2;
        if (total(mid) <= L.room) lo = mid;
        else hi = mid;
      }
      s = lo;
    }
    const eps = s < 1 ? 0.0005 : 0.004;
    for (let i = 0; i < L.els.length; i++) {
      const v = L.t[i] * s;
      if (force || Math.abs(v - L.v[i]) >= eps) {
        L.v[i] = v;
        L.els[i].style.fontVariationSettings = fvsLetter(v);
      }
    }
    if (L.ul) {
      let w = L.base;
      for (let i = 0; i < L.v.length; i++) w += sample(L.w[i], L.v[i]);
      L.ul.style.width = (w * L.fs).toFixed(1) + "px";
    }
  }

  function fit() {
    measureChars(klines.flatMap((L) => L.chars));
    const contW = heroEl.clientWidth;
    const compact = tablet.matches;
    klines.forEach((L) => {
      L.w = L.chars.map((c) => widthCache.get(c)!.d);
      L.base = L.chars.reduce((s, c) => s + widthCache.get(c)!.base, 0);
    });
    // every line shares one size: the widest line fills ~97% of the column...
    const maxBase = Math.max(...klines.map((L) => L.base));
    let fs = (contW * (compact ? 0.94 : 0.97)) / maxBase;
    if (!compact) {
      // ...capped so the name, eyebrow and copy all fit the hero body height
      const hb = $(".hero__body"),
        cp = $(".hero__copy"),
        eb = $(".hero__eyebrow");
      const gap = parseFloat(getComputedStyle(hb).rowGap) || 0;
      fs = Math.min(fs, (hb.clientHeight - cp.offsetHeight - gap - (eb ? eb.offsetHeight + 20 : 0) - 24) / (klines.length * 0.76 + 0.1));
    } else fs = Math.min(fs, contW * 0.5);
    klines.forEach((L) => {
      L.line.style.setProperty("--fs", fs.toFixed(2) + "px");
      L.fs = fs;
    });
    // letter centres measured at rest, from layout offsets so entrance transforms do not affect them
    klines.forEach((L) => L.els.forEach((n) => (n.style.fontVariationSettings = "")));
    const sy = scrollY;
    klines.forEach((L) => {
      const lr = L.line.getBoundingClientRect();
      L.cx = L.els.map((n) => lr.left + n.offsetLeft + n.offsetWidth / 2);
      L.cy = L.els.map((n) => lr.top + sy + n.offsetTop + n.offsetHeight / 2);
      L.room = Math.max(0, (contW - L.base * L.fs) / L.fs - 0.04);
      L.v = L.els.map(() => 0);
      applyLine(L, true);
    });
  }

  ctx.frameFns.add((_now, k, y) => {
    if (!S.on || !S.fine) return;
    const rate = lerpK(0.12, k),
      vh = innerHeight;
    for (const L of klines) {
      let active = false;
      for (let i = 0; i < L.els.length; i++) {
        const dy = L.cy[i] - y;
        if (dy < -KRADIUS || dy > vh + KRADIUS) continue;
        active = true;
        let h = 0;
        if (S.inside) {
          const d = Math.hypot(S.px - L.cx[i], S.py - dy);
          if (d < KRADIUS) h = smooth(1 - d / KRADIUS);
        }
        L.t[i] += (h - L.t[i]) * rate;
      }
      if (active) applyLine(L);
    }
  });

  return {
    fit,
    /** Drops cached glyph widths (call when fonts finish loading). */
    invalidate() {
      widthCache.clear();
    },
    /** Snaps every letter back to rest. */
    reset() {
      klines.forEach((L) => {
        L.t.fill(0);
        applyLine(L, true);
      });
    },
  };
}
