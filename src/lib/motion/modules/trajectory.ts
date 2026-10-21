import type { MotionContext } from "../context";
import type { SmoothScroll } from "./smoothScroll";
import { setActiveLayer } from "./orbit";
import { $, $$, lerpK, smoothRange } from "../utils";

/**
 * Trajectory experience (pinned scene): a glowing probe travels a cubic curve past one station per role,
 * oldest → newest, as you scroll; the drawn line follows it and the camera eases after it for parallax.
 * Clicking a station scrolls to its position.
 */
export function createTrajectory(ctx: MotionContext, scroll: SmoothScroll) {
  const { root } = ctx;
  const sec = $(".traj");
  const cam = $("[data-tcam]");
  const svg = $<SVGSVGElement>("[data-tsvg]");
  const ghost = $<SVGPathElement>("[data-tghost]"),
    path = $<SVGPathElement>("[data-tpath]"),
    line = $<SVGPathElement>("[data-tline]");
  const grad = $<SVGLinearGradientElement>("[data-tgrad]");
  const probe = $("[data-tprobe]");
  const text = $("[data-ttext]");
  const bar$ = $("[data-tbar]");
  const stations = $$<HTMLButtonElement>(".ts", $("[data-tstations]"));
  const layers = $$(".ol", text);
  const n = stations.length;
  const T = { q: 0, active: -1, top: 0, run: 0, len: 0, fr: [] as number[], cx: null as number | null, cy: null as number | null, W: 0, H: 0, mob: false };

  stations.forEach((b, k) => ctx.on(b, "click", () => scroll.jumpTo(T.top + (k / (n - 1)) * T.run)));

  ctx.measureFns.add(() => {
    const W = innerWidth,
      H = innerHeight,
      mob = W <= 700;
    Object.assign(T, { W, H, mob });
    T.top = sec.getBoundingClientRect().top + scrollY;
    T.run = sec.offsetHeight - H;
    // control points as fractions of the viewport: rises from bottom-left to top-right
    const P = mob
      ? [[-0.06, 0.58], [0.3, 0.6], [0.5, 0.24], [1.1, 0.26]]
      : [[-0.03, 0.96], [0.36, 0.96], [0.52, 0.34], [1.05, 0.26]];
    const pts = P.map((p) => [p[0] * W, p[1] * H]);
    const d = `M ${pts[0].join(" ")} C ${pts[1].join(" ")}, ${pts[2].join(" ")}, ${pts[3].join(" ")}`;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    [ghost, path, line].forEach((p) => p.setAttribute("d", d));
    ghost.setAttribute("transform", `translate(0 ${mob ? 14 : 24})`);
    grad.setAttribute("x1", String(pts[0][0]));
    grad.setAttribute("y1", String(pts[0][1]));
    grad.setAttribute("x2", String(pts[3][0]));
    grad.setAttribute("y2", String(pts[3][1]));
    T.len = path.getTotalLength();
    line.style.strokeDasharray = `${T.len} ${T.len}`;
    // station positions along the path
    T.fr = mob ? [0.42, 0.62, 0.82] : [0.6, 0.76, 0.92];
    stations.forEach((b, k) => {
      const p = path.getPointAtLength(T.len * T.fr[k]);
      b.style.transform = `translate(${p.x}px,${p.y}px)`;
      b.classList.toggle("is-flip", k === n - 1 && p.x > W * 0.72);
    });
  });

  ctx.frameFns.add((_now, k, y) => {
    const { H, W, mob } = T;
    if (!(y > T.top - H && y < T.top + T.run + H)) return;
    const on = root.dataset.motion === "on";
    const qT = Math.min(1, Math.max(0, (y - T.top) / Math.max(1, T.run))) * (n - 1);
    T.q += (qT - T.q) * (on ? lerpK(0.09, k) : 1);
    const approach = smoothRange(T.top - H, T.top, y),
      leave = 1 - smoothRange(T.top + T.run, T.top + T.run + H * 0.8, y);
    const i0 = Math.min(n - 2, Math.floor(T.q)),
      f = T.q >= n - 1 ? T.fr[n - 1] : T.fr[i0] + (T.fr[i0 + 1] - T.fr[i0]) * (T.q - i0);
    const fr = f * approach + 0.02 * (1 - approach);
    const p = path.getPointAtLength(T.len * fr);
    line.style.strokeDashoffset = (T.len * (1 - fr)).toFixed(1);
    probe.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
    // camera trails the probe
    const camX = (0.5 - fr) * W * (mob ? 0.1 : 0.14),
      camY = (fr - 0.5) * H * (mob ? 0.06 : 0.1);
    T.cx = T.cx == null ? camX : T.cx + (camX - T.cx) * (on ? lerpK(0.06, k) : 1);
    T.cy = T.cy == null ? camY : T.cy + (camY - T.cy) * (on ? lerpK(0.06, k) : 1);
    cam.style.transform = `translate3d(${T.cx.toFixed(1)}px,${T.cy.toFixed(1)}px,0)`;
    cam.style.opacity = leave.toFixed(3);

    const ai = Math.round(T.q);
    if (ai !== T.active) {
      T.active = ai;
      setActiveLayer(layers, ai);
    }
    stations.forEach((b, k2) => {
      b.classList.toggle("is-on", k2 === ai);
      b.classList.toggle("is-reached", fr >= T.fr[k2] - 0.005);
    });
    bar$.style.transform = `scaleX(${(T.q / (n - 1)).toFixed(4)})`;
    text.style.translate = `0 ${((T.q - ai) * -40).toFixed(1)}px`;
    text.style.opacity = (approach * leave).toFixed(3);
  });
}
