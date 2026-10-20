import { INTRO_SEEN_KEY } from "./modules/intro";

/**
 * Runs inline in <head> before first paint: flags JS + motion preference on <html>
 * and decides whether the intro plays (once per session). The failsafe reveals
 * the page if the engine never boots.
 */
export const bootScript = `(function () {
  var r = document.documentElement;
  r.setAttribute("data-js", "");
  r.setAttribute("data-glx", "c");
  var reduce = false, seen = false;
  try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try { seen = sessionStorage.getItem("${INTRO_SEEN_KEY}") === "1"; } catch (e) {}
  r.setAttribute("data-motion", reduce ? "off" : "on");
  if (!reduce && !seen) r.setAttribute("data-intro", "run");
  window.__folioFailsafe = setTimeout(function () { r.removeAttribute("data-intro"); r.classList.add("entered"); }, 7000);
})();`;
