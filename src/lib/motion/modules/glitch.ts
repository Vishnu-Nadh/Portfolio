import type { MotionContext } from "../context";
import type { Sound } from "./sound";
import { $, $$, cssVar } from "../utils";

export type Glitch = ReturnType<typeof createGlitch>;

const HOLD = "steps(1, end)";
const R = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

interface BurstOpts {
  n?: number;
  amp?: number;
  dur?: number;
  delay?: number;
  /** true = two-colour split, "mono" = single colour, false = no split */
  rgb?: boolean | "mono";
  flicker?: boolean;
  colors?: string[];
  /** chance that a frame is slice-clipped */
  sliceP?: number;
}

/**
 * Datamosh glitch layer: held-frame horizontal tears with colour split and slice clipping,
 * full-screen signal bars + scanline, scattered shards and a tiled dissolve for the intro exit.
 * Every hook is a no-op while motion is paused.
 */
export function createGlitch(ctx: MotionContext, sound: Sound) {
  const { root } = ctx;
  const PK = cssVar("--accent", "#ff4d8d"),
    AM = cssVar("--accent-2", "#ffb547"),
    INK = cssVar("--text", "#f6f0f4"),
    BG = cssVar("--bg", "#0b0810");
  const live = () => root.dataset.motion === "on";
  const done = (a: Animation) => {
    a.onfinish = () => a.cancel();
    return a;
  };
  const sliceClip = () => {
    const t = R(0, 80),
      h = R(8, 45);
    return `inset(${t.toFixed(1)}% 0 ${Math.max(0, 100 - t - h).toFixed(1)}% 0)`;
  };

  /* burst: n held frames of horizontal offset, colour split and slice clipping, then clean.
     Uses the individual `translate` property so it composes with transforms the engine animates. */
  function burst(el: Element | null, o: BurstOpts = {}) {
    if (!el) return null;
    const { n = 6, amp = 10, dur = 420, delay = 0, rgb = true, flicker = false, sliceP = 0.5 } = o;
    const colors = o.colors ?? [PK, AM];
    const f: Keyframe[] = [];
    for (let i = 0; i < n; i++) {
      const d = R(2, Math.max(3, amp * 0.6)) * (Math.random() < 0.5 ? -1 : 1);
      const k: Keyframe = { translate: `${R(-amp, amp).toFixed(1)}px 0`, easing: HOLD, clipPath: Math.random() < sliceP ? sliceClip() : "inset(0 0 0 0)" };
      k.filter =
        rgb === "mono"
          ? `drop-shadow(${d.toFixed(1)}px 0 0 ${colors[0]})`
          : rgb
            ? `drop-shadow(${d.toFixed(1)}px 0 0 ${colors[0]}) drop-shadow(${(-d).toFixed(1)}px 0 0 ${colors[1]})`
            : "none";
      if (flicker) k.opacity = i === 0 ? 0 : i % 2 ? 1 : 0.3;
      f.push(k);
    }
    sound.glitch({ n, dur, delay, amp });
    const end: Keyframe = { translate: "0 0", filter: "none", clipPath: "inset(0 0 0 0)" };
    if (flicker) end.opacity = 1;
    f.push(end);
    return done(el.animate(f, { duration: dur, delay, fill: flicker ? "backwards" : "none" }));
  }

  /* full-screen overlay: signal bars + scanline (markup in GlitchOverlay.tsx) */
  const ov = $(".glx-ov");
  const sbars = $$(".glx-bar", ov),
    scanEl = $(".glx-scan", ov);
  function flash({ dur = 280, delay = 0, strong = 1 } = {}) {
    if (!live()) return;
    sound.static({ dur, delay, strong });
    sbars.forEach((b) => {
      const f: Keyframe[] = [];
      for (let i = 0; i < 5; i++)
        f.push({
          opacity: Math.random() < 0.7 ? R(0.5, 0.95) * strong : 0,
          top: `${R(0, 96).toFixed(1)}%`,
          height: `${R(0.4, 9).toFixed(2)}vh`,
          translate: `${R(-30, 30).toFixed(0)}vw 0`,
          background: pick([PK, AM, INK, BG]),
          easing: HOLD,
        });
      f.push({ opacity: 0 });
      done(b.animate(f, { duration: dur, delay }));
    });
  }
  function scan(dur = 1200, delay = 0) {
    sound.sweep({ dur, delay });
    done(
      scanEl.animate([{ top: "-4px", opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.9 }, { top: "100%", opacity: 0 }], {
        duration: dur,
        delay,
        easing: "linear",
      }),
    );
  }

  /* frags: scattered shards that jump around the screen in held frames */
  function frags(host: HTMLElement, { n = 28, dur = 560, delay = 0, rate = 1 } = {}) {
    if (!live()) return;
    sound.static({ dur: dur * 0.7, delay, strong: 0.6 });
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i");
      d.style.cssText = `position:absolute;left:0;top:0;display:block;pointer-events:none;opacity:0;width:${R(1.5, 18).toFixed(1)}vw;height:${R(0.25, 3.2).toFixed(2)}vh;background:${pick([PK, PK, AM, INK])}`;
      host.append(d);
      const f: Keyframe[] = [],
        k = 3 + ((Math.random() * 4) | 0);
      for (let j = 0; j < k; j++) f.push({ opacity: Math.random() < 0.75 ? R(0.6, 1) : 0, transform: `translate(${R(-5, 100).toFixed(1)}vw,${R(0, 100).toFixed(1)}vh)`, easing: HOLD });
      f.push({ opacity: 0 });
      const a = d.animate(f, { duration: dur * R(0.5, 1), delay: delay + R(0, dur * 0.45) });
      a.playbackRate = rate;
      a.onfinish = a.oncancel = () => d.remove();
    }
  }

  /* dissolve: the intro background breaks into horizontal tiles that tear sideways and drop out at random */
  function dissolve(host: HTMLElement, { dur = 820, rate = 1, rows = 14 } = {}) {
    const bg = getComputedStyle(document.body).backgroundColor || BG;
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden";
    host.append(wrap);
    const as: Promise<unknown>[] = [];
    for (let r = 0; r < rows; r++) {
      let x = 0;
      const top = (r * 100) / rows,
        h = 100 / rows + 0.15;
      while (x < 100) {
        const w = Math.min(100 - x, R(5, 24)),
          t = document.createElement("i");
        t.style.cssText = `position:absolute;display:block;left:${x.toFixed(2)}%;top:${top.toFixed(2)}%;width:${(w + 0.15).toFixed(2)}%;height:${h.toFixed(2)}%;background:${bg}`;
        wrap.append(t);
        x += w;
        const e = Math.min(0.98, R(0.12, 1)),
          o1 = e * R(0.45, 0.8);
        const hit = Math.random() < 0.22 ? pick([PK, AM, INK]) : bg;
        const a = t.animate(
          [
            { offset: 0, opacity: 1, translate: "0 0", easing: HOLD },
            { offset: o1, opacity: 1, translate: `${R(-90, 90).toFixed(0)}px 0`, background: hit, easing: HOLD },
            { offset: e, opacity: 0 },
            { offset: 1, opacity: 0 },
          ],
          { duration: dur, fill: "forwards" },
        );
        a.playbackRate = rate;
        as.push(a.finished.catch(() => {}));
      }
    }
    if (live()) sound.glitch({ n: 8, dur: dur * 0.8, amp: 30 });
    return Promise.all(as).then(() => wrap.remove());
  }

  return {
    live,
    burst,
    flash,
    frags,
    dissolve,
    /** section reveal: rise + torn flicker-in */
    reveal(n: HTMLElement, delay: number) {
      if (!live()) return false;
      n.style.opacity = "";
      done(n.animate([{ transform: "translateY(28px)" }, { transform: "none" }], { duration: 900, delay, easing: ctx.ease.out, fill: "both" }));
      burst(n, { n: 7, amp: 26, dur: 520, delay, flicker: true, rgb: "mono", sliceP: 0.85 });
      return true;
    },
    /** statement words tear in one after another */
    words(p: HTMLElement) {
      if (!live()) return false;
      $$(".wd", p).forEach((w, i) => burst(w, { n: 6, amp: 22, dur: 460, delay: 35 * i, flicker: true, rgb: "mono", sliceP: 0.9 }));
      return true;
    },
    /** transition bars slide in/out from alternating sides */
    bars(i: number, dir: "in" | "out"): Keyframe[] | null {
      if (!live()) return null;
      const s = i % 2 ? 1 : -1;
      return dir === "in" ? [{ transform: `translateX(${101 * s}%)` }, { transform: "none" }] : [{ transform: "none" }, { transform: `translateX(${-101 * s}%)` }];
    },
    transIn(label: HTMLElement) {
      if (!live()) return;
      sound.portal("in");
      burst(label, { n: 8, amp: 40, dur: 560, delay: 260, rgb: "mono", colors: [INK], sliceP: 0.9 });
      flash({ dur: 300, delay: 80, strong: 0.7 });
    },
    transOut() {
      if (!live()) return;
      sound.portal("out");
      flash({ dur: 320 });
    },
    introIn({ letters, logo }: { letters: HTMLElement[]; logo: HTMLElement }) {
      if (!live()) return;
      sound.hum();
      scan(1150, 60);
      letters.forEach((l, i) => burst(l, { n: 6, amp: 30, dur: 520, delay: 80 + 30 * i, rgb: "mono", sliceP: 0.9 }));
      burst(logo, { n: 7, amp: 40, dur: 420, delay: 900, rgb: "mono", sliceP: 1 });
    },
    countTick(count: HTMLElement, e: number) {
      if (!live() || e >= 1) return;
      if (Math.random() < 0.035) burst(count, { n: 3, amp: 10, dur: 160, rgb: "mono", sliceP: 0.8 });
    },
    introOut({ logo }: { logo: HTMLElement }) {
      if (!live()) return;
      sound.humStop();
      burst(logo, { n: 8, amp: 80, dur: 460, rgb: "mono", sliceP: 1 });
      flash({ dur: 420 });
    },
    landing() {
      if (!live()) return;
      sound.impact(0, 1);
      flash({ dur: 360 });
      scan(700);
    },
    landed() {
      if (!live()) return;
      sound.chime();
      burst($(".logo"), { n: 5, amp: 12, dur: 340, rgb: "mono", sliceP: 1 });
    },
    /** page entrance: the hero name lines tear in */
    enter() {
      if (!live()) return;
      $$(".hero__line").forEach((l, i) => burst(l, { n: 7, amp: 46, dur: 520, delay: 280 + i * 160, rgb: "mono", sliceP: 0.9 }));
      flash({ dur: 300, delay: 200, strong: 0.6 });
    },
  };
}
