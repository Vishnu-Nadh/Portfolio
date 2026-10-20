import type { MotionContext } from "../context";
import { $, $$, clamp } from "../utils";

export type Skills = ReturnType<typeof createSkills>;

/**
 * Skills: hovering / focusing / tapping a big skill name switches the sticky colour-field card.
 * Desktop: a progress bar tracks the list against the viewport centre.
 * Tablet with touch: the item nearest the viewport centre is selected as you scroll.
 */
export function createSkills(ctx: MotionContext) {
  const { S, mq } = ctx;
  const list = $("[data-sklist]");
  const items = $$<HTMLButtonElement>(".skills__item", list);
  const layers = $$(".skm__l");
  const col = $(".skills__col");
  const cur$ = $("[data-skcur]"),
    bar$ = $("[data-skbar]");
  let cur = -1,
    prog = -1;

  const setBar = (p: number) => {
    if (Math.abs(p - prog) > 0.001) {
      prog = p;
      bar$.style.transform = `scaleX(${p.toFixed(4)})`;
    }
  };

  function setSkill(i: number) {
    if (i === cur) return;
    cur = i;
    cur$.textContent = "0" + (i + 1);
    layers.forEach((l, n) => {
      l.classList.toggle("is-on", n === i);
      l.classList.toggle("is-past", n < i);
      l.setAttribute("aria-hidden", n === i ? "false" : "true");
    });
    items.forEach((b, n) => {
      b.classList.toggle("is-on", n === i);
      b.setAttribute("aria-pressed", n === i ? "true" : "false");
    });
  }

  items.forEach((b, i) => {
    ctx.on(b, "mouseenter", () => S.fine && setSkill(i));
    ctx.on(b, "focus", () => setSkill(i));
    ctx.on(b, "click", () => setSkill(i));
  });
  setSkill(0);

  ctx.frameFns.add(() => {
    if (mq.mobile.matches) return;
    const r = list.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const f = items[0].getBoundingClientRect(),
      l = items[items.length - 1].getBoundingClientRect();
    const a = f.top + f.height / 2,
      b = l.top + l.height / 2;
    setBar(clamp((innerHeight / 2 - a) / (b - a || 1)));
  });

  ctx.frameFns.add(() => {
    if (!mq.tablet.matches || S.fine || mq.mobile.matches) return;
    const c = innerHeight / 2;
    let best = 0,
      bd = 1e9;
    items.forEach((b, n) => {
      const r = b.getBoundingClientRect(),
        d = Math.abs(r.top + r.height / 2 - c);
      if (d < bd) {
        bd = d;
        best = n;
      }
    });
    const lr = list.getBoundingClientRect();
    if (lr.bottom > 0 && lr.top < innerHeight) setSkill(best);
  });

  return { layers, col, setSkill, setBar, current: () => cur };
}
