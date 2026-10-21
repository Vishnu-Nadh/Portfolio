/* Small DOM + math helpers shared by the motion modules. */

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

export const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, txt?: string | null) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
/** Frame-rate independent lerp factor. */
export const lerpK = (rate: number, k: number) => 1 - Math.pow(1 - rate, k);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise<number>((r) => requestAnimationFrame(r));

/** Archivo axes for a kinetic letter at "heat" t (0 = rest, 1 = fully stretched). */
export const fvsLetter = (t: number) => `"wdth" ${(70 + 55 * t).toFixed(1)}, "wght" ${(800 - 540 * t).toFixed(0)}`;

/** Reads a CSS custom property from :root (theme tokens live in SCSS). */
export const cssVar = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

/** Smoothstep of x between a and b (0 before a, 1 after b; a may be greater than b). */
export const smoothRange = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
