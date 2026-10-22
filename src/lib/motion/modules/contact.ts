import type { MotionContext } from "../context";
import type { SmoothScroll } from "./smoothScroll";
import type { Stage } from "./scene3d";
import { $, $$ } from "../utils";

const E = "cubic-bezier(.16,1,.3,1)",
  IO = "cubic-bezier(.65,0,.35,1)";

/**
 * "Transmission" contact console: opens from the [data-contact] button as an expanding circle (like the warp),
 * validates as you type (the signal-strength meter fills with valid fields), and on send folds the form away
 * and fires the message off as a beam of light before showing the "received" state.
 */
export function createContact(ctx: MotionContext, scroll: SmoothScroll, stage: Stage) {
  const { root } = ctx;
  const tx = $("[data-tx]");
  const panel = $("[data-txpanel]"),
    veil = $(".tx__veil", tx),
    head = $(".tx__head", tx);
  const form = $<HTMLFormElement>("[data-txform]"),
    done = $("[data-txdone]");
  const fill = $("[data-txfill]"),
    pct = $("[data-txpct]");
  const on = () => root.dataset.motion === "on";
  let origin: { x: number; y: number } | null = null,
    lastFocus: HTMLElement | null = null;

  function open(btn: HTMLElement) {
    lastFocus = btn;
    tx.hidden = false;
    form.hidden = false;
    done.hidden = true;
    form.style.cssText = "";
    const r = btn.getBoundingClientRect(),
      p = panel.getBoundingClientRect();
    origin = { x: r.left + r.width / 2 - p.left, y: r.top + r.height / 2 - p.top };
    scroll.pause();
    root.style.overflow = "hidden";
    if (on()) {
      const radius = Math.hypot(p.width, p.height) * 1.1;
      panel.animate(
        [
          { clipPath: `circle(0px at ${origin.x}px ${origin.y}px)`, opacity: 0.6 },
          { clipPath: `circle(${radius}px at ${origin.x}px ${origin.y}px)`, opacity: 1 },
        ],
        { duration: 760, easing: IO },
      );
      veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
      [...(form.children as HTMLCollectionOf<HTMLElement>), head].forEach((n, i) =>
        n.animate(
          [
            { opacity: 0, transform: "translateY(16px)", filter: "blur(6px)" },
            { opacity: 1, transform: "none", filter: "blur(0)" },
          ],
          { duration: 700, delay: 200 + 60 * i, easing: E, fill: "backwards" },
        ),
      );
      stage.warp(0.5);
    }
    window.setTimeout(() => $("input", form).focus({ preventScroll: true }), on() ? 420 : 0);
  }

  async function close() {
    if (tx.hidden) return;
    if (on()) {
      const p = panel.getBoundingClientRect(),
        o = origin || { x: p.width / 2, y: p.height / 2 };
      const radius = Math.hypot(p.width, p.height) * 1.1;
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" });
      const a = panel.animate([{ clipPath: `circle(${radius}px at ${o.x}px ${o.y}px)` }, { clipPath: `circle(0px at ${o.x}px ${o.y}px)` }], {
        duration: 560,
        easing: IO,
        fill: "forwards",
      });
      try {
        await a.finished;
      } catch {
        /* cancelled */
      }
      panel.getAnimations().forEach((x) => x.cancel());
      veil.getAnimations().forEach((x) => x.cancel());
    }
    tx.hidden = true;
    root.style.overflow = "";
    scroll.resume();
    lastFocus?.focus({ preventScroll: true });
  }

  $$("[data-contact]").forEach((b) =>
    ctx.on(b, "click", (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      open(b);
    }),
  );
  ctx.on(tx, "click", (e: MouseEvent) => {
    if ((e.target as Element).closest("[data-txclose]")) close();
  });
  ctx.on(window, "keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && !tx.hidden) close();
  });

  // fade the field edges only while they actually scroll (very short screens)
  const fade = () => {
    const sc = form.scrollHeight > form.clientHeight + 2;
    form.classList.toggle("is-scroll", sc && form.scrollTop > 4);
    form.classList.toggle("is-top", sc && form.scrollTop <= 4);
  };
  ctx.on(form, "scroll", fade, { passive: true });
  ctx.on(window, "resize", fade);
  const ro = new ResizeObserver(fade);
  ro.observe(form);
  ctx.cleanup(() => ro.disconnect());

  // validation + signal-strength meter
  const fields = $$<HTMLInputElement | HTMLTextAreaElement>("input[name=name], input[name=email], textarea", form);
  const valid = (f: HTMLInputElement | HTMLTextAreaElement) =>
    f.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()) : f.value.trim().length > (f.tagName === "TEXTAREA" ? 4 : 0);
  const meter = () => {
    const n = fields.filter(valid).length / fields.length;
    fill.style.transform = `scaleX(${n})`;
    pct.textContent = Math.round(n * 100) + "%";
  };
  ctx.on(form, "input", (e: Event) => {
    meter();
    const t = e.target as HTMLInputElement;
    const l = t.closest(".tx__f");
    if (l && valid(t)) l.classList.remove("is-bad");
  });

  ctx.on(form, "submit", async (e: SubmitEvent) => {
    e.preventDefault();
    const bad = fields.filter((f) => !valid(f));
    fields.forEach((f) => f.closest(".tx__f")?.classList.toggle("is-bad", !valid(f)));
    if (bad.length) {
      bad[0].focus();
      return;
    }
    // TODO: send to a form endpoint (Formspree, Resend, a route handler, etc.) with new FormData(form)
    if (on()) {
      const btn = $("[type=submit]", form).getBoundingClientRect();
      await form
        .animate(
          [
            { opacity: 1, transform: "none", filter: "blur(0)" },
            { opacity: 0, transform: "scale(.92) translateY(10px)", filter: "blur(10px)" },
          ],
          { duration: 520, easing: IO, fill: "forwards" },
        )
        .finished.catch(() => {});
      // the message leaves as a point of light, up and out of the top of the screen
      const beam = document.createElement("div");
      beam.className = "tx__beam";
      document.body.append(beam);
      const x0 = btn.left + btn.width / 2,
        y0 = btn.top + btn.height / 2;
      stage.warp(1);
      await beam
        .animate(
          [
            { transform: `translate(${x0}px,${y0}px) scale(1)`, opacity: 1 },
            { transform: `translate(${x0}px,${y0 - 80}px) scale(2.4)`, opacity: 1, offset: 0.25 },
            { transform: `translate(${innerWidth * 0.5}px,-60px) scale(.4)`, opacity: 0 },
          ],
          { duration: 1000, easing: "cubic-bezier(.5,0,.2,1)" },
        )
        .finished.catch(() => {});
      beam.remove();
    }
    form.hidden = true;
    done.hidden = false;
    form.reset();
    meter();
    fields.forEach((f) => f.closest(".tx__f")?.classList.remove("is-bad"));
    if (on())
      ([...done.children] as HTMLElement[]).forEach((n, i) =>
        n.animate(
          [
            { opacity: 0, transform: "translateY(14px)", filter: "blur(6px)" },
            { opacity: 1, transform: "none", filter: "blur(0)" },
          ],
          { duration: 700, delay: 80 * i, easing: E, fill: "backwards" },
        ),
      );
    $("button", done).focus({ preventScroll: true });
  });
  meter();
}
