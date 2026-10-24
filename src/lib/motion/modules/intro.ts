import type { MotionContext } from "../context";
import type { Cursor } from "./cursor";
import type { SmoothScroll } from "./smoothScroll";
import type { Stage } from "./scene3d";
import { $, $$, sleep } from "../utils";

export const INTRO_SEEN_KEY = "folio-intro";

/** gentle out-curve used throughout the intro: no hard cuts */
const SOFT = "cubic-bezier(.22,1,.36,1)";
/** half view height in world units at the orb's depth (camera fov 32°, distance 9) */
const HH = Math.tan((16 * Math.PI) / 180) * 9;
/** orb scale for an on-screen radius in px (shell radius 1.25) */
const scaleFor = (rPx: number) => ((rPx / (innerHeight / 2)) * HH) / 1.25;
/** out-curve for the ignition burst */
const OUTE = "cubic-bezier(.16,1,.3,1)";

/**
 * Tagline-first intro (galaxy): each word of the tagline begins as a star and a constellation links them; a comet
 * sweeps across and ignites the words as it passes, and the hollow word ("open.") breathes. Then the line fades,
 * the words drift toward the centre out of focus, a point gathers there and blooms softly into the orb, which
 * glides on to its hero pose as the page fades up. No logo. Click / Esc fast-forwards (4x).
 */
export function createIntro(ctx: MotionContext, cursor: Cursor, scroll: SmoothScroll, stage: Stage, enterPage: () => void) {
  const { S, flags, root, ease } = ctx;
  const intro = $(".intro");
  let rate = 1;
  const restFvs = (italic: boolean) => (italic ? '"wdth" 110, "wght" 250' : '"wdth" 68, "wght" 850');

  async function run() {
    flags.introRunning = true;
    rate = 1;
    root.dataset.intro = "playing";
    // the engine is alive: the boot failsafe must not cut this (longer) intro short
    clearTimeout(window.__folioFailsafe);
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* storage blocked */
    }
    root.style.overflow = "hidden";
    scroll.pause();

    const letters = $$(".intro__ch", intro),
      box = $(".intro__box", intro);
    const meta = $(".intro__meta", intro),
      count = $(".intro__count", intro),
      line = $(".intro__line", intro),
      bg = $(".intro__bg", intro);
    const play = (n: HTMLElement, kf: Keyframe[], o: KeyframeAnimationOptions) => {
      const a = n.animate(kf, o);
      a.playbackRate = rate;
      return a;
    };
    const fin = async (a: Animation) => {
      try {
        await a.finished;
      } catch {
        /* cancelled */
      }
    };
    // waits in intro time (so fast-forward shortens them too)
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        let acc = 0,
          last = performance.now();
        const step = (t: number) => {
          acc += Math.max(0, t - last) * rate;
          last = t;
          if (acc >= ms || !flags.alive) res();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    // counter + progress line over ms of intro time
    const countTo = (ms: number) =>
      new Promise<void>((res) => {
        let acc = 0,
          last = performance.now();
        const step = (t: number) => {
          acc += Math.max(0, t - last) * rate;
          last = t;
          const e = 1 - Math.pow(1 - Math.min(1, acc / ms), 3);
          count.textContent = String(Math.round(100 * e)).padStart(3, "0");
          line.style.transform = `scaleX(${e.toFixed(4)})`;
          if (acc >= ms || !flags.alive) res();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    const speedUp = () => {
      if (rate !== 1) return;
      rate = 4;
      intro.getAnimations({ subtree: true }).forEach((a) => a.updatePlaybackRate(4));
      $("main").getAnimations().forEach((a) => a.updatePlaybackRate(4));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") speedUp();
    };
    intro.dataset.cursor = "Skip";
    intro.addEventListener("click", speedUp);
    window.addEventListener("keydown", onKey);
    const detach = () => {
      intro.removeEventListener("click", speedUp);
      window.removeEventListener("keydown", onKey);
    };
    ctx.cleanup(detach);
    intro.className = "intro v-d";

    /* ---------- tagline first ---------- */
    // The orb starts as a hidden point at the centre and blooms there later. The 3D stage keeps building in
    // the background while the tagline plays (it yields between steps), so it is ready by the bloom.
    const point = { x: 0, y: 0, s: 0.001, shell: 1, op: 1, ex: 0, full: 1 };
    stage.pose(point, true);
    // stars held at a gentle warp through the tagline (queued if the stage is still building)
    stage.setWarp(0.25, true);
    const W = innerWidth,
      H = innerHeight,
      mob = W <= 700;
    const mk = (parent: HTMLElement, cls: string) => {
      const d = document.createElement("div");
      d.className = cls;
      parent.append(d);
      return d;
    };
    const layer = document.createElement("div");
    layer.className = "ix";
    intro.insertBefore(layer, bg.nextSibling);
    const tag = mk(layer, "ix-tag");
    const words: HTMLElement[] = [];
    ctx.data.intro.tagline.forEach((row) => {
      const r = mk(tag, "ix-row");
      row.forEach((w) => {
        const o = document.createElement("span"),
          i = document.createElement("span");
        o.className = w.hollow ? "ix-w ix-w--hollow" : "ix-w";
        i.className = "ix-wi";
        i.textContent = w.text;
        i.style.fontVariationSettings = restFvs(false);
        o.append(i);
        r.append(o);
        words.push(o);
      });
    });
    const sub = mk(tag, "ix-sub");
    sub.textContent = ctx.data.intro.sub;
    const inner = (o: HTMLElement) => o.firstElementChild as HTMLElement;
    [...letters, box].forEach((n) => (n.style.opacity = "0"));
    words.forEach((o) => (inner(o).style.opacity = "0"));
    play(meta, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 300, easing: SOFT, fill: "both" });
    countTo(6400);

    // word centres (layout is final; words are only visually hidden)
    const pts = words.map((o) => {
      const r = o.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height * 0.52 };
    });
    const cx = W / 2,
      cy = H / 2;

    /* 1. stars + constellation */
    const NS = "http://www.w3.org/2000/svg",
      svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ix-const");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    layer.append(svg);
    const pl = document.createElementNS(NS, "polyline");
    pl.setAttribute("points", pts.map((q) => q.x.toFixed(1) + "," + q.y.toFixed(1)).join(" "));
    svg.append(pl);
    const len = pts.reduce((acc, q, i) => (i ? acc + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0), 0);
    pl.style.strokeDasharray = `${len} ${len}`;
    pl.style.strokeDashoffset = String(len);
    const stars = pts.map((q, i) => {
      const st = mk(layer, "ix-star");
      st.style.left = q.x + "px";
      st.style.top = q.y + "px";
      st.style.zIndex = "2";
      play(
        st,
        [
          { transform: "translate(-50%,-50%) scale(0)", opacity: 0 },
          { transform: "translate(-50%,-50%) scale(1.6)", opacity: 1, offset: 0.6 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        ],
        { duration: 600, delay: 150 + 120 * i, easing: SOFT, fill: "both" },
      );
      return st;
    });
    play(pl as unknown as HTMLElement, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1100, delay: 300, easing: ease.io, fill: "forwards" });
    await wait(1250);
    if (!flags.alive) return;

    /* 2. a comet sweeps across and ignites each word as it passes */
    const comet = mk(layer, "ix-comet");
    const x0 = -W * 0.15,
      x1 = W * 1.15,
      y0 = cy + H * 0.12,
      y1 = cy - H * 0.12,
      CD = 1500;
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    play(
      comet,
      [
        { transform: `translate(${x0}px,${y0}px) rotate(${ang}deg)`, opacity: 0 },
        { opacity: 1, offset: 0.08 },
        { opacity: 1, offset: 0.9 },
        { transform: `translate(${x1}px,${y1}px) rotate(${ang}deg)`, opacity: 0 },
      ],
      { duration: CD, easing: "linear", fill: "forwards" },
    );
    words.forEach((o, i) => {
      const w = inner(o),
        t = Math.max(0, (pts[i].x - x0) / (x1 - x0)) * CD; // when the comet reaches this word
      play(w, [{ transform: "scale(.25)", filter: "blur(14px)", opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: "none", filter: "blur(0px)", opacity: 1 }], { duration: 1000, delay: t, easing: SOFT, fill: "both" });
      play(w, [{ fontVariationSettings: '"wdth" 125, "wght" 150' }, { fontVariationSettings: restFvs(false) }], { duration: 1400, delay: t, easing: SOFT, fill: "both" });
      play(stars[i], [{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(3)", opacity: 0 }], { duration: 700, delay: t, easing: SOFT, fill: "forwards" });
    });
    play(svg as unknown as HTMLElement, [{ opacity: 1 }, { opacity: 0.35 }], { duration: 900, delay: 900, fill: "forwards" });
    play(sub, [{ opacity: 0, letterSpacing: ".5em" }, { opacity: 1, letterSpacing: ".14em" }], { duration: 1200, delay: CD * 0.75, easing: SOFT, fill: "both" });
    const hollow = words.find((o) => o.classList.contains("ix-w--hollow"));
    if (hollow)
      play(inner(hollow), [{ textShadow: "0 0 18px rgba(255,77,141,.25)" }, { textShadow: "0 0 46px rgba(255,77,141,.6)" }, { textShadow: "0 0 18px rgba(255,77,141,.25)" }], {
        duration: 1800,
        delay: CD,
        iterations: 2,
        easing: "ease-in-out",
      });
    await wait(CD + 1300);
    if (!flags.alive) return;

    /* 3. release: the line fades, the words ease toward the centre and dissolve out of focus */
    stage.setWarp(-0.3, true);
    const DR = 1300,
      EZ = "cubic-bezier(.45,0,.2,1)";
    play(svg as unknown as HTMLElement, [{ opacity: 0.35 }, { opacity: 0 }], { duration: 700, easing: EZ, fill: "forwards" });
    [...words, sub].forEach((o, i) => {
      const r = o.getBoundingClientRect(),
        dx = (cx - r.left - r.width / 2) * 0.55,
        dy = (cy - r.top - r.height / 2) * 0.55;
      o.style.overflow = "visible";
      play(o, [{ transform: "none", opacity: 1, filter: "blur(0px)" }, { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(.72)`, opacity: 0, filter: "blur(14px)" }], {
        duration: DR,
        delay: 40 * i,
        easing: EZ,
        fill: "forwards",
      });
    });
    const core = mk(layer, "ix-pt");
    play(core, [{ transform: "translate(-50%,-50%) scale(0)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.4)", opacity: 1 }], { duration: 1000, delay: 450, easing: SOFT, fill: "both" });
    await wait(1450);
    if (!flags.alive) return;

    /* 4. ignition: soft shockwave, stars released, the orb blooms at the centre.
       Normally the stage finished building long ago; on a slow device the gathered point keeps glowing
       for up to 2.5s more rather than blooming into nothing. */
    await Promise.race([stage.ready, sleep(2500)]);
    if (!flags.alive) return;
    stage.release();
    const fl = mk(layer, "ix-flash"),
      s1 = mk(layer, "ix-shock"),
      s2 = mk(layer, "ix-shock ix-shock--2");
    play(core, [{ transform: "translate(-50%,-50%) scale(1.4)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(5)", opacity: 0 }], { duration: 700, easing: OUTE, fill: "forwards" });
    play(fl, [{ transform: "scale(.1)", opacity: 0 }, { opacity: 0.8, offset: 0.15 }, { transform: "scale(1.3)", opacity: 0 }], { duration: 1500, easing: OUTE, fill: "forwards" });
    play(s1, [{ transform: "scale(.02)", opacity: 0.9 }, { transform: "scale(3.6)", opacity: 0 }], { duration: 1500, easing: OUTE, fill: "forwards" });
    play(s2, [{ transform: "scale(.02)", opacity: 0.7 }, { transform: "scale(2.4)", opacity: 0 }], { duration: 1700, delay: 120, easing: OUTE, fill: "forwards" });
    stage.pose({ x: 0, y: 0, s: scaleFor(Math.min(H * (mob ? 0.16 : 0.2), W * 0.28)), shell: 1, op: 1, ex: 0, full: 1, rate: 0.08 });
    await wait(1300);
    if (!flags.alive) return;

    /* 5. the orb glides on to its hero pose */
    play(meta, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
    stage.pose(stage.heroPose());
    await wait(600);
    if (!flags.alive) return;

    /* ---------- handoff: the page fades up underneath ---------- */
    stage.pose(null);
    stage.release();
    stage.intro(false);
    const mainEl = $("main"),
      header = $("header");
    delete root.dataset.intro;
    root.style.overflow = "";
    scroll.resume();
    enterPage();
    play(mainEl, [{ opacity: 0, filter: "blur(8px)", transform: "translateY(24px)" }, { opacity: 1, filter: "blur(0px)", transform: "none" }], { duration: 1400, easing: SOFT });
    play(header, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: 300, easing: SOFT, fill: "backwards" });
    await fin(play(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 1200, easing: SOFT, fill: "forwards" }));
    if (!flags.alive) return;

    detach();
    delete intro.dataset.cursor;
    intro.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    layer.remove();
    intro.className = "intro";
    letters.forEach((l) => (l.style.cssText = ""));
    [box, meta, line].forEach((n) => (n.style.opacity = ""));
    bg.style.opacity = "";
    flags.introRunning = false;
    rate = 1;
    cursor.refresh();
  }

  ctx.on($("[data-replay]"), "click", async () => {
    if (!S.on || flags.introRunning || flags.busy) return;
    scroll.jumpTo(0, true);
    await sleep(60);
    if (!flags.alive) return;
    root.dataset.intro = "playing";
    run();
  });

  return { run };
}
