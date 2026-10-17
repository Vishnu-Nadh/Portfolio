import type { MotionContext } from "../context";
import { $, $$ } from "../utils";

export type Say = (msg: string) => void;

/** Status toast + wiring for every [data-toast] trigger. */
export function createToast(ctx: MotionContext) {
  const toastEl = $(".toast");
  let timer = 0;

  const say: Say = (msg) => {
    clearTimeout(timer);
    toastEl.textContent = msg;
    toastEl.dataset.show = "";
    timer = window.setTimeout(() => delete toastEl.dataset.show, 2400);
  };

  $$("[data-toast]").forEach((n) =>
    ctx.on(n, "click", (e: MouseEvent) => {
      e.preventDefault();
      say(n.dataset.toast ?? "");
    }),
  );

  ctx.cleanup(() => clearTimeout(timer));
  return { say };
}
