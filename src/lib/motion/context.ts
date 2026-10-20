import type { PortfolioData } from "@/types/portfolio";
import { cssVar } from "./utils";

export type FrameFn = (now: number, k: number, y: number) => void;
export type MeasureFn = () => void;

/** Live pointer / motion state shared by every module. */
export interface MotionState {
  /** Fine pointer (mouse / trackpad). */
  fine: boolean;
  /** Motion enabled (not reduced, not paused). */
  on: boolean;
  px: number;
  py: number;
  inside: boolean;
  /** Smoothed scroll velocity. */
  vel: number;
  /** Frame delta relative to 60fps. */
  k: number;
}

export interface MotionContext {
  data: PortfolioData;
  root: HTMLElement;
  S: MotionState;
  mq: { fine: MediaQueryList; reduce: MediaQueryList; mobile: MediaQueryList; tablet: MediaQueryList };
  ease: { out: string; io: string };
  flags: { alive: boolean; busy: boolean; introRunning: boolean };
  frameFns: Set<FrameFn>;
  measureFns: Set<MeasureFn>;
  /** Adds a listener that is removed when the engine is destroyed. */
  on<T extends EventTarget>(target: T, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions | boolean): void;
  /** Registers a disposer run on destroy. */
  cleanup(fn: () => void): void;
  dispose(): void;
}

export function createContext(data: PortfolioData): MotionContext {
  const root = document.documentElement;
  const mq = {
    fine: matchMedia("(pointer: fine)"),
    reduce: matchMedia("(prefers-reduced-motion: reduce)"),
    mobile: matchMedia(`(max-width: ${cssVar("--bp-mobile", "700px")})`),
    tablet: matchMedia(`(max-width: ${cssVar("--bp-tablet", "1100px")})`),
  };
  const disposers: Array<() => void> = [];

  return {
    data,
    root,
    mq,
    S: { fine: mq.fine.matches, on: !mq.reduce.matches, px: -999, py: -999, inside: false, vel: 0, k: 1 },
    // easings come from the SCSS tokens so CSS transitions and WAAPI stay in sync
    ease: {
      out: cssVar("--ease-out", "cubic-bezier(.16,1,.3,1)"),
      io: cssVar("--ease-io", "cubic-bezier(.76,0,.24,1)"),
    },
    flags: { alive: true, busy: false, introRunning: false },
    frameFns: new Set(),
    measureFns: new Set(),
    on(target, type, fn, opts) {
      const h = fn as unknown as EventListener;
      target.addEventListener(type, h, opts);
      disposers.push(() => target.removeEventListener(type, h, opts));
    },
    cleanup(fn) {
      disposers.push(fn);
    },
    dispose() {
      this.flags.alive = false;
      while (disposers.length) disposers.pop()!();
      this.frameFns.clear();
      this.measureFns.clear();
    },
  };
}
