import type { MotionContext } from "../context";
import { $$ } from "../utils";

/** Live local time in every [data-clock]. */
export function createClock(ctx: MotionContext) {
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: ctx.data.timeZone, hour: "2-digit", minute: "2-digit" });
  const tick = () => $$("[data-clock]").forEach((n) => (n.textContent = fmt.format(new Date())));
  tick();
  const id = window.setInterval(tick, 20000);
  ctx.cleanup(() => clearInterval(id));
}
