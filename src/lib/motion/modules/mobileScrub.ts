import type { MotionContext } from "../context";
import type { Skills } from "./skills";
import type { ExperienceList } from "./experience";
import { $, clamp, smooth } from "../utils";

interface Scrub {
  box: HTMLElement;
  card: HTMLElement;
  layers: HTMLElement[];
  bar?: (p: number) => void;
  set: (i: number) => void;
  cur: () => number;
  /** d = signed distance of this layer from the current position, in entries */
  apply: (l: HTMLElement, d: number, ch: number, cw: number) => void;
  clear: (l: HTMLElement) => void;
}

const tf = (n: Element, v: string) => ((n as HTMLElement).style.transform = v);

/**
 * Mobile: the skills and experience lists become invisible scroll runways and the sticky
 * cards scrub between entries as you scroll through them.
 */
export function createMobileScrub(ctx: MotionContext, skills: Skills, experience: ExperienceList) {
  const { S, mq } = ctx;

  const scrubs: Scrub[] = [
    {
      box: $(".skills__grid"),
      card: skills.col,
      layers: skills.layers,
      bar: skills.setBar,
      set: skills.setSkill,
      cur: skills.current,
      // skills layer children: [bg, big, top, mid, tools]
      apply(l, d, _ch, cw) {
        const [bg, big, , mid, tools] = [...l.children] as HTMLElement[];
        l.style.clipPath = d > 0 ? `inset(0 0 0 ${(Math.min(1, d) * 100).toFixed(2)}%)` : "inset(0 0 0 0)";
        tf(bg, `translate3d(${(d * cw * 0.12).toFixed(1)}px,0,0)`);
        tf(big, `translate3d(${(d * cw * 0.5).toFixed(1)}px,0,0)`);
        mid.style.opacity = clamp(1 - Math.abs(d) * 1.3).toFixed(3);
        tf(mid, `translate3d(${(d * cw * 0.3).toFixed(1)}px,0,0)`);
        ([...tools.children] as HTMLElement[]).forEach((li, j) => {
          li.style.opacity = clamp(1 - Math.abs(d) * (1.4 + j * 0.15)).toFixed(3);
          tf(li, `translate3d(${(d * cw * (0.35 + j * 0.06)).toFixed(1)}px,0,0)`);
        });
      },
      clear(l) {
        const [bg, big, , mid, tools] = [...l.children] as HTMLElement[];
        l.style.clipPath = "";
        [bg, big, mid, ...([...tools.children] as HTMLElement[])].forEach((n) => {
          n.style.transform = "";
          n.style.opacity = "";
        });
      },
    },
    {
      box: $(".work__grid"),
      card: experience.col,
      layers: experience.layers,
      set: experience.setFocus,
      cur: experience.current,
      apply(l, d, ch) {
        l.style.opacity = clamp(1 - Math.abs(d) * 1.6).toFixed(3);
        tf($(".exp__top", l), `translate3d(0,${(d * ch * 0.18).toFixed(1)}px,0)`);
        tf($(".exp__body", l), `translate3d(0,${(d * ch * 0.42).toFixed(1)}px,0)`);
        $(".exp", l).style.backgroundPosition = `0 ${(d * ch * 0.08).toFixed(1)}px`;
      },
      clear(l) {
        l.style.opacity = "";
        $(".exp__top", l).style.transform = $(".exp__body", l).style.transform = "";
        $(".exp", l).style.backgroundPosition = "";
      },
    },
  ];

  ctx.on(mq.mobile, "change", () => scrubs.forEach((s) => s.layers.forEach((l) => s.clear(l))));

  ctx.frameFns.add(() => {
    if (!mq.mobile.matches) return;
    const vh = innerHeight;
    scrubs.forEach((s) => {
      const b = s.box.getBoundingClientRect();
      if (b.bottom < 0 || b.top > vh) return;
      const n = s.layers.length,
        cr = s.card.getBoundingClientRect(),
        st = parseFloat(getComputedStyle(s.card).top) || 0;
      const p = clamp((st - b.top) / Math.max(1, b.height - cr.height));
      // eased step between entries: holds on each entry, then moves through the middle 60%
      const f = p * (n - 1),
        k0 = Math.min(n - 2, Math.floor(f)),
        fe = k0 + smooth(clamp((f - k0 - 0.2) / 0.6));
      const idx = Math.round(fe);
      if (idx !== s.cur()) s.set(idx);
      s.bar?.(p);
      s.layers.forEach((l, i) => s.apply(l, S.on ? i - fe : i - idx, cr.height, cr.width));
    });
  });
}
