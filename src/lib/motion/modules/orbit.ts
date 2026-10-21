import { pad2 } from "@/lib/format";
import type { MotionContext } from "../context";
import type { SmoothScroll } from "./smoothScroll";
import { $, $$, lerpK, smoothRange } from "../utils";

export const setActiveLayer = (layers: HTMLElement[], i: number) =>
  layers.forEach((l, j) => {
    l.classList.toggle("is-on", j === i);
    l.classList.toggle("is-past", j < i);
    l.setAttribute("aria-hidden", j === i ? "false" : "true");
  });

/**
 * Orbital skills (pinned scene): each skill is a planet on a tilted elliptical orbit around the sun
 * (the 3D orb parks there). Scroll drives a continuous orbit angle; the planet at the front is the
 * active skill and its text panel shows. Clicking a planet scrolls to its position.
 */
export function createOrbit(ctx: MotionContext, scroll: SmoothScroll) {
  const { root } = ctx;
  const sec = $(".orbit");
  const svg = $<SVGSVGElement>("[data-osvg]");
  const sun = $("[data-osun]");
  const text = $("[data-otext]");
  const cur$ = $("[data-ocur]");
  const bar$ = $("[data-obar]");
  const planets = $$<HTMLButtonElement>(".op", $("[data-oplanets]")).map((b) => ({ b, ball: $(".op__ball", b), lab: $(".op__lab", b) }));
  const layers = $$(".ol", text);
  const n = planets.length;
  const O = { p: 0, active: -1, top: 0, run: 0, cx: 0, cy: 0, rx: 0, ry: 0, tilt: (-10 * Math.PI) / 180, sunD: 0, H: 0 };

  planets.forEach((P, i) => ctx.on(P.b, "click", () => scroll.jumpTo(O.top + (i / (n - 1)) * O.run)));

  ctx.measureFns.add(() => {
    const W = innerWidth,
      H = innerHeight,
      mob = W <= 700,
      tab = W <= 1100;
    O.H = H;
    O.top = sec.getBoundingClientRect().top + scrollY;
    O.run = sec.offsetHeight - H;
    O.cx = mob ? W * 0.5 : tab ? W * 0.74 : W * 0.7;
    O.cy = mob ? H * 0.36 : H * 0.53;
    O.rx = mob ? W * 0.4 : tab ? W * 0.2 : Math.min(W * 0.24, 400);
    O.ry = O.rx * 0.35;
    O.sunD = O.rx * 0.6;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    $$("ellipse", svg).forEach((e) => {
      const k = Number(e.dataset.oe);
      e.setAttribute("cx", String(O.cx));
      e.setAttribute("cy", String(O.cy));
      e.setAttribute("rx", String(O.rx * k));
      e.setAttribute("ry", String(O.ry * k));
      e.setAttribute("transform", `rotate(-10 ${O.cx} ${O.cy})`);
    });
    Object.assign(sun.style, { left: O.cx + "px", top: O.cy + "px", width: O.sunD + "px", height: O.sunD + "px" });
    ctx.anchors.orbit = { x: O.cx, y: O.cy, d: O.sunD };
  });

  ctx.frameFns.add((_now, k, y) => {
    const on = root.dataset.motion === "on",
      H = O.H;
    // continuous angle from scroll, eased
    const pT = Math.min(1, Math.max(0, (y - O.top) / Math.max(1, O.run))) * (n - 1);
    O.p += (pT - O.p) * (on ? lerpK(0.09, k) : 1);
    if (!(y > O.top - H && y < O.top + O.run + H)) return;

    const enter = smoothRange(O.top - H, O.top, y),
      leave = 1 - smoothRange(O.top + O.run, O.top + O.run + H * 0.8, y);
    const spinIn = (1 - enter) * 1.4; // planets swing in as the section arrives
    planets.forEach((P, i) => {
      const a = ((90 + (i - O.p) * 90) * Math.PI) / 180 + spinIn;
      const x = O.rx * Math.cos(a),
        yy = O.ry * Math.sin(a),
        s = Math.sin(a),
        dpt = (s + 1) / 2;
      const X = O.cx + x * Math.cos(O.tilt) - yy * Math.sin(O.tilt),
        Y = O.cy + x * Math.sin(O.tilt) + yy * Math.cos(O.tilt);
      const size = O.rx * (0.09 + 0.14 * dpt),
        sc = size / 100;
      let op = (0.35 + 0.65 * dpt) * enter * leave;
      if (s < 0) op *= 0.25 + 0.75 * smoothRange(O.sunD * 0.3, O.sunD * 0.75, Math.abs(X - O.cx)); // hidden behind the sun
      P.b.style.transform = `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px)`;
      P.b.style.zIndex = s > 0 ? "4" : "1";
      P.b.style.opacity = op.toFixed(3);
      P.ball.style.transform = `scale(${sc.toFixed(3)})`;
      P.b.style.setProperty("--sc", sc.toFixed(3));
      P.ball.style.filter = s < 0 ? `blur(${(-s * 2).toFixed(2)}px) brightness(${(0.6 + 0.4 * dpt).toFixed(2)})` : "none";
      P.lab.style.top = (size / 2 + 14).toFixed(1) + "px";
    });

    const ai = Math.round(O.p);
    if (ai !== O.active) {
      O.active = ai;
      setActiveLayer(layers, ai);
    }
    planets.forEach((P, i) => P.b.classList.toggle("is-on", i === ai));
    cur$.textContent = pad2(ai + 1);
    bar$.style.transform = `scaleX(${(O.p / (n - 1)).toFixed(4)})`;
    text.style.translate = `0 ${((O.p - ai) * -40).toFixed(1)}px`;
    svg.style.transform = `rotate(${(O.p * 2).toFixed(2)}deg) scale(${(0.9 + 0.1 * enter).toFixed(3)})`;
    svg.style.transformOrigin = `${O.cx}px ${O.cy}px`;
    svg.style.opacity = (enter * leave).toFixed(3);
    text.style.opacity = (enter * leave).toFixed(3);
  });
}
