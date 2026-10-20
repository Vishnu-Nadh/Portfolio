import type { MotionContext } from "../context";
import { $ } from "../utils";

export type Sound = ReturnType<typeof createSound>;

const STORE_KEY = "folio-sfx";
const PENTA = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];

const R = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

/**
 * Glitch sound layer. Everything is synthesized live with Web Audio (no audio files):
 * bit-crushed stutters timed to the visual glitch frames, a wobbling drone for the intro,
 * sub impacts on landing and short UI ticks. Browsers only allow audio after a gesture,
 * so the context is created on the first pointer / key press while sound is on.
 */
export function createSound(ctx: MotionContext) {
  let on = true;
  try {
    on = localStorage.getItem(STORE_KEY) !== "0";
  } catch {
    /* storage blocked */
  }
  let ac: AudioContext | null = null;
  let out: GainNode | null = null;
  let B: { fine: AudioBuffer; crush: AudioBuffer; heavy: AudioBuffer } | null = null;
  let humV: { os: OscillatorNode[]; g: GainNode; lfo: OscillatorNode } | null = null;
  let humTimer = 0;
  const stack = [1];
  const lv = () => stack[stack.length - 1];

  function init() {
    if (ac) return ac;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 8;
    comp.attack.value = 0.002;
    comp.release.value = 0.12;
    out = ac.createGain();
    out.gain.value = 0.35;
    out.connect(comp);
    comp.connect(ac.destination);
    // stepped noise buffers: hold = samples per step, bits = amplitude resolution
    const mk = (hold: number, bits: number) => {
      const sr = ac!.sampleRate,
        b = ac!.createBuffer(1, (sr * 1.6) | 0, sr),
        d = b.getChannelData(0);
      let v = 0;
      for (let i = 0; i < d.length; i++) {
        if (i % hold === 0) v = Math.round((Math.random() * 2 - 1) * bits) / bits;
        d[i] = v;
      }
      return b;
    };
    B = { fine: mk(1, 64), crush: mk(9, 6), heavy: mk(36, 3) };
    return ac;
  }

  const ready = () => on && lv() > 0 && !!ac && ac.state === "running" && !document.hidden;
  /* visual glitches only make sound during the intro; everything else goes through play() */
  let direct = 0;
  const auto = () => direct > 0 || !!ctx.root.dataset.intro;
  const T = (delay = 0) => ac!.currentTime + 0.01 + delay / 1000;

  // voice admission: keeps simultaneous glitch sounds sparse
  const slots: number[] = [];
  function admit(t: number, gap = 0.06, max = 6) {
    const now = ac!.currentTime;
    for (let i = slots.length - 1; i >= 0; i--) if (slots[i] < now - 0.08) slots.splice(i, 1);
    if (slots.length >= max || slots.some((x) => Math.abs(x - t) < gap)) return false;
    slots.push(t);
    return true;
  }

  const G = (v = 0) => {
    const g = ac!.createGain();
    g.gain.value = v;
    return g;
  };
  const F = (type: BiquadFilterType, f: number, q = 1) => {
    const n = ac!.createBiquadFilter();
    n.type = type;
    n.frequency.value = f;
    n.Q.value = q;
    return n;
  };
  const N = (buf: AudioBuffer, rate = 1) => {
    const s = ac!.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = rate;
    return s;
  };
  const O = (type: OscillatorType, f: number) => {
    const o = ac!.createOscillator();
    o.type = type;
    o.frequency.value = f;
    return o;
  };

  interface GlitchOpts {
    n?: number;
    dur?: number;
    delay?: number;
    amp?: number;
  }

  /* datamosh glitch: crushed-noise stutter, filtered warm, with pentatonic blips and a soft sub tap */
  function glitchC({ n = 6, dur = 400, delay = 0, amp = 10 }: GlitchOpts) {
    const t0 = T(delay),
      d = Math.max(0.08, dur / 1000),
      fr = d / n,
      L = lv() * Math.min(1, 0.4 + amp / 40);
    const src = N(B!.crush, R(0.7, 1.15)),
      bp = F("bandpass", 1400, 1.8),
      lp = F("lowpass", 4200, 0.6),
      ga = G();
    src.connect(bp).connect(lp).connect(ga).connect(out!);
    const osc = O("triangle", 440),
      og = G();
    osc.connect(og).connect(out!);
    for (let i = 0; i < n; i++) {
      const t = t0 + i * fr;
      ga.gain.setValueAtTime(Math.random() < 0.8 ? L * R(0.24, 0.44) : 0, t);
      bp.frequency.setValueAtTime(R(500, 3400), t);
      osc.frequency.setValueAtTime(pick(PENTA) * (Math.random() < 0.3 ? 2 : 1), t);
      og.gain.setValueAtTime(Math.random() < 0.6 ? L * 0.11 : 0, t);
    }
    ga.gain.setValueAtTime(0, t0 + d);
    og.gain.setValueAtTime(0, t0 + d);
    src.start(t0, R(0, 1.2));
    src.stop(t0 + d + 0.03);
    osc.start(t0);
    osc.stop(t0 + d + 0.03);
    const s = O("sine", 110),
      sg = G(0.0001);
    s.connect(sg).connect(out!);
    s.frequency.setValueAtTime(110, t0);
    s.frequency.exponentialRampToValueAtTime(48, t0 + 0.12);
    sg.gain.setValueAtTime(L * 0.3, t0);
    sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    s.start(t0);
    s.stop(t0 + 0.18);
  }

  function glitch(o: GlitchOpts) {
    if (!ready()) return;
    if (!admit(T(o.delay))) return;
    glitchC(o);
  }

  function staticNoise({ dur = 280, delay = 0, strong = 1 }) {
    if (!ready()) return;
    const t0 = T(delay);
    if (!admit(t0, 0.1, 6)) return;
    const d = dur / 1000,
      src = N(B!.crush, R(0.7, 1.3)),
      hp = F("highpass", 1100),
      ga = G();
    src.connect(hp).connect(ga).connect(out!);
    for (let t = 0; t < d; t += 0.028) ga.gain.setValueAtTime(Math.random() < 0.65 ? lv() * 0.2 * strong : 0, t0 + t);
    ga.gain.setValueAtTime(0, t0 + d);
    src.start(t0, R(0, 1));
    src.stop(t0 + d + 0.03);
  }

  function sweep({ dur = 1200, delay = 0 }) {
    if (!ready()) return;
    const t0 = T(delay),
      d = dur / 1000;
    const o = O("sine", 90),
      ga = G(0.0001);
    o.connect(ga).connect(out!);
    o.frequency.setValueAtTime(90, t0);
    o.frequency.exponentialRampToValueAtTime(1100, t0 + d);
    ga.gain.setValueAtTime(0.0001, t0);
    ga.gain.exponentialRampToValueAtTime(lv() * 0.07, t0 + 0.08);
    ga.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.start(t0);
    o.stop(t0 + d + 0.02);
  }

  function impact(delay = 0, k = 1) {
    if (!ready()) return;
    const t0 = T(delay);
    const o = O("sine", 150),
      og = G(0.0001);
    o.connect(og).connect(out!);
    o.frequency.setValueAtTime(150, t0);
    o.frequency.exponentialRampToValueAtTime(36, t0 + 0.32);
    og.gain.setValueAtTime(lv() * 0.9 * k, t0);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    o.start(t0);
    o.stop(t0 + 0.5);
    const n = N(B!.heavy, 0.6),
      lp = F("lowpass", 2200),
      ng = G();
    n.connect(lp).connect(ng).connect(out!);
    ng.gain.setValueAtTime(lv() * 0.45 * k, t0);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
    n.start(t0);
    n.stop(t0 + 0.1);
  }

  function hum() {
    if (!ready() || humV) return;
    const t0 = T(0);
    const lp = F("lowpass", 380, 6),
      g = G(0.0001),
      lfo = O("sine", 6.5),
      lg = G(160);
    lfo.connect(lg).connect(lp.frequency);
    lp.connect(g).connect(out!);
    const os = [-12, 12].map((det) => {
      const o = O("triangle", 55);
      o.detune.value = det;
      o.frequency.setValueAtTime(55, t0);
      o.frequency.exponentialRampToValueAtTime(110, t0 + 2.2);
      o.connect(lp);
      o.start(t0);
      return o;
    });
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(lv() * 0.16, t0 + 0.5);
    lp.frequency.setValueAtTime(260, t0);
    lp.frequency.linearRampToValueAtTime(1400, t0 + 2.2);
    lfo.start(t0);
    humV = { os, g, lfo };
    humTimer = window.setTimeout(() => humStop(), 6000);
  }

  /* tape-stop: the drone pitches down to nothing */
  function humStop() {
    if (!humV || !ac) return;
    const v = humV;
    humV = null;
    const t0 = T(0);
    v.os.forEach((o) => {
      o.frequency.cancelScheduledValues(t0);
      o.frequency.setValueAtTime(o.frequency.value, t0);
      o.frequency.exponentialRampToValueAtTime(18, t0 + 0.32);
      o.stop(t0 + 0.4);
    });
    v.g.gain.cancelScheduledValues(t0);
    v.g.gain.setValueAtTime(v.g.gain.value, t0);
    v.g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.36);
    v.lfo.stop(t0 + 0.4);
  }

  function chime() {
    if (!ready()) return;
    const t0 = T(40);
    [440, 659.3, 880].forEach((f, i) => {
      const o = O("triangle", f),
        g = G(0.0001);
      o.connect(g).connect(out!);
      const t = t0 + i * 0.07;
      g.gain.setValueAtTime(lv() * 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.start(t);
      o.stop(t + 0.55);
    });
  }

  /* ---------- UI sounds (50-350ms, no tails) ---------- */
  function tick(k = 1) {
    const t0 = T(0),
      L = 0.16 * k;
    const o = O("square", R(2200, 2600)),
      hp = F("highpass", 1200),
      g = G(0.0001);
    o.connect(hp).connect(g).connect(out!);
    g.gain.setValueAtTime(L, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.028);
    o.start(t0);
    o.stop(t0 + 0.035);
    const n = N(B!.crush, R(0.9, 1.3)),
      bp = F("bandpass", 3200, 1.4),
      ng = G(0.0001);
    n.connect(bp).connect(ng).connect(out!);
    ng.gain.setValueAtTime(L * 0.9, t0);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    n.start(t0, R(0, 1.2));
    n.stop(t0 + 0.06);
    return 0.06;
  }

  /* page transition, matched to the ~1.3s motion: a stuttering crushed sweep while the bars cover,
     then a glitch burst as the label lands */
  function transition() {
    const t0 = T(0),
      d = 0.58;
    const src = N(B!.crush, 0.9),
      bp = F("bandpass", 220, 3),
      ga = G(0);
    src.connect(bp).connect(ga).connect(out!);
    bp.frequency.setValueAtTime(220, t0);
    bp.frequency.exponentialRampToValueAtTime(4200, t0 + d);
    for (let t = 0; t < d; t += 0.034) ga.gain.setValueAtTime(Math.random() < 0.72 ? 0.05 + 0.24 * (t / d) : 0, t0 + t);
    ga.gain.setValueAtTime(0, t0 + d);
    src.start(t0, R(0, 0.8));
    src.stop(t0 + d + 0.03);
    [-9, 9].forEach((det) => {
      const o = O("triangle", 110),
        lp = F("lowpass", 1600),
        og = G(0.0001);
      o.detune.value = det;
      o.connect(lp).connect(og).connect(out!);
      o.frequency.setValueAtTime(110, t0);
      o.frequency.exponentialRampToValueAtTime(660, t0 + d);
      og.gain.setValueAtTime(0.0001, t0);
      og.gain.exponentialRampToValueAtTime(0.05, t0 + d * 0.7);
      og.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.02);
      o.start(t0);
      o.stop(t0 + d + 0.04);
    });
    direct++;
    stack.push(0.75);
    glitchC({ n: 5, dur: 170, delay: d * 1000 - 120, amp: 16 });
    stack.pop();
    direct--;
    return d + 0.06;
  }

  /* bars clear: glitch burst + low thump */
  function land() {
    direct++;
    stack.push(0.6);
    glitchC({ n: 4, dur: 160, delay: 0, amp: 14 });
    stack.pop();
    direct--;
    const t0 = T(120),
      o = O("sine", 120),
      g = G(0.0001);
    o.connect(g).connect(out!);
    o.frequency.setValueAtTime(120, t0);
    o.frequency.exponentialRampToValueAtTime(40, t0 + 0.18);
    g.gain.setValueAtTime(0.35, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    o.start(t0);
    o.stop(t0 + 0.24);
    return 0.36;
  }

  /* ---------- controller ----------
     play(name, el) is the only entry point for interaction sound:
     per-element cooldown 300ms, 60ms minimum gap, max 2 voices at once */
  const SOUNDS = { tick: () => tick(), soft: () => tick(0.6), transition, land };
  type SoundName = keyof typeof SOUNDS;
  const cool = new WeakMap<object, number>();
  const voices: number[] = [];
  let lastAt = 0;
  function play(name: SoundName, el?: object) {
    if (!ready()) return false;
    const now = performance.now();
    if (el) {
      const c = cool.get(el);
      if (c && now - c < 300) return false;
      cool.set(el, now);
    }
    if (now - lastAt < 60) return false;
    for (let i = voices.length - 1; i >= 0; i--) if (voices[i] < now) voices.splice(i, 1);
    if (voices.length >= 2 && name !== "transition" && name !== "land") return false;
    lastAt = now;
    voices.push(now + SOUNDS[name]() * 1000);
    return true;
  }

  /* where sound plays: nav links, experience rows, solid CTAs and skills tick on pointer entry;
     touch gets deliberate taps only. Scrolling, keyboard focus and reveals stay silent. */
  const hoverable = matchMedia("(hover: hover) and (pointer: fine)");
  const NAV = ".header__link, .header__cta, .logo",
    RICH = ".row, .btn--solid",
    SKILL = ".skills__item";
  ctx.on(document, "mouseover", (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!on || !hoverable.matches || !target?.closest) return;
    const t = target.closest(`${RICH}, ${NAV}, ${SKILL}`);
    if (!t || (e.relatedTarget && t.contains(e.relatedTarget as Node))) return;
    play("tick", t);
  });
  ctx.on(
    document,
    "pointerup",
    (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!on || e.pointerType !== "touch" || !target?.closest) return;
      const t = target.closest(`${RICH}, ${SKILL}`);
      if (t && !t.closest("[data-nav]")) play("tick", t);
    },
    { passive: true },
  );

  // autoplay policy: the context is created/resumed on the first real gesture while sound is on
  const unlock = () => {
    if (!on) return;
    init();
    if (ac && ac.state !== "running") ac.resume().catch(() => {});
  };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => ctx.on(window, ev, unlock, { passive: true, capture: true }));
  ctx.on(document, "visibilitychange", () => {
    if (ac && document.hidden) ac.suspend();
    else if (ac && on) ac.resume();
  });

  // toggle in the floating pill
  const btn = $<HTMLButtonElement>(".glx-snd");
  const mark = () => {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? ctx.data.sound.on : ctx.data.sound.off);
  };
  mark();
  ctx.on(btn, "click", (e: MouseEvent) => {
    e.stopPropagation();
    on = !on;
    try {
      localStorage.setItem(STORE_KEY, on ? "1" : "0");
    } catch {
      /* storage blocked */
    }
    mark();
    if (on) {
      init();
      ac?.resume().then(() => play("tick")).catch(() => {});
    } else humStop();
  });

  ctx.cleanup(() => {
    clearTimeout(humTimer);
    ac?.close().catch(() => {});
    ac = null;
  });

  return {
    /* visual-glitch sounds: only audible during the intro */
    glitch: (o: GlitchOpts) => auto() && glitch(o),
    static: (o: { dur?: number; delay?: number; strong?: number }) => auto() && staticNoise(o),
    sweep: (o: { dur?: number; delay?: number }) => auto() && sweep(o),
    impact,
    hum,
    humStop,
    chime,
    play,
    portal: (dir: "in" | "out") => play(dir === "in" ? "transition" : "land"),
  };
}
