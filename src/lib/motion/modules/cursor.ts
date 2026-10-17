import type { MotionContext } from "../context";
import { $, lerpK } from "../utils";

export type Cursor = ReturnType<typeof createCursor>;

/** Dot + lagging ring cursor with contextual labels from [data-cursor]. */
export function createCursor(ctx: MotionContext) {
  const { S, flags } = ctx;
  const dot = $(".cur-dot");
  const ring = $(".cur-ring");
  const ringLabel = ring.firstElementChild as HTMLElement;
  const cur = { x: -999, y: -999, scale: 0.35, target: 0.35, key: "" };

  function over(node: Element | null) {
    if (!S.fine || !S.on) return;
    const host = flags.busy || (flags.introRunning && !node) ? null : node?.closest?.<HTMLElement>("[data-cursor]");
    const label = host ? (host.dataset.cursor ?? "") : "";
    const small = !label && node?.closest?.("a,button,[data-magnet]");
    const dark = !!host && host.dataset.cursorTone === "dark"; // dark bubble over accent-filled rows
    const key = label + (small ? "|s" : "") + (dark ? "|d" : "");
    if (key === cur.key) return;
    cur.key = key;
    ringLabel.textContent = label;
    cur.target = label ? 1 : small ? 0.55 : 0.35;
    ring.style.color = dark ? "var(--text)" : "";
    ring.style.background = label ? (dark ? "var(--bg)" : "var(--accent)") : "transparent";
    ring.style.borderColor = label ? "transparent" : small ? "var(--accent)" : "var(--cursor-ring)";
    dot.style.opacity = label ? "0" : "1";
  }

  /** Re-evaluates the label under the pointer (after overlays finish). */
  function refresh() {
    if (S.inside) over(document.elementFromPoint(S.px, S.py));
  }

  ctx.on(
    window,
    "mousemove",
    (e: MouseEvent) => {
      S.px = e.clientX;
      S.py = e.clientY;
      if (!S.inside) {
        S.inside = true;
        cur.x = e.clientX;
        cur.y = e.clientY;
        ring.style.opacity = "1";
        over(e.target as Element);
      }
    },
    { passive: true },
  );
  ctx.on(document, "mouseleave", () => {
    S.inside = false;
    ring.style.opacity = "0";
  });
  ctx.on(window, "mouseover", (e: MouseEvent) => over(e.target as Element), { passive: true });

  ctx.frameFns.add(() => {
    if (!S.fine || !S.on || !S.inside) return;
    const k = S.k,
      dx = S.px - cur.x,
      dy = S.py - cur.y,
      ds = cur.target - cur.scale;
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(ds) > 0.05) {
      cur.x += dx * lerpK(0.18, k);
      cur.y += dy * lerpK(0.18, k);
      cur.scale += ds * lerpK(0.15, k);
      ring.style.transform = `translate3d(${cur.x - 44}px,${cur.y - 44}px,0) scale(${cur.scale.toFixed(3)})`;
    }
    dot.style.transform = `translate3d(${S.px}px,${S.py}px,0)`;
  });

  return {
    over,
    refresh,
    /** Hides the native cursor only while the custom one is live. */
    syncNative() {
      document.body.toggleAttribute("data-nocursor", S.fine && S.on);
    },
    hide() {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    },
    show() {
      dot.style.opacity = "1";
      ring.style.opacity = S.inside ? "1" : "0";
    },
  };
}
