export type NavTarget = "top" | "work" | "hello" | "contact";

export interface Brand {
  /** Upright, uppercase part of the wordmark ("First"). */
  first: string;
  /** Single glyph shown inside the accent box ("L"). */
  mark: string;
  /** Italic remainder of the wordmark ("astname"). */
  rest: string;
}

export interface Project {
  /** Each entry renders on its own line in the list. */
  lines: string[];
  year: string;
  type: string;
  /** Optional accent tag, e.g. "Live". Empty string hides it. */
  tag: string;
  platform: string;
  /** Hue (0–360) used for the placeholder artwork gradient. */
  hue: number;
}

export interface CloseUp {
  name: string;
  kind: string;
  hue: number;
}

export interface Stat {
  label: string;
  value: number;
}

export interface NavLink {
  label: string;
  target: NavTarget;
  variant: "link" | "cta";
  cursor?: string;
}

export interface PortfolioData {
  meta: { title: string; description: string };
  brand: Brand;
  heroLines: string[];
  role: string;
  place: string;
  /** IANA zone used for the live clock in the header/footer. */
  timeZone: string;
  marquee: string[];
  projects: Project[];
  closeUps: CloseUp[];
  nav: NavLink[];
  /** Big label + sub label shown by the page transition, per nav target. */
  transitions: Record<NavTarget, [label: string, sub: string]>;
  hero: {
    eyebrow: string;
    intro: string;
    scrollHint: string;
    cta: string;
  };
  work: {
    title: string;
    years: string;
    pause: string;
    play: string;
    rowCta: string;
  };
  closeSection: { title: string; hint: string };
  hello: { eyebrow: string; statement: string; stats: Stat[] };
  footer: { headline: string; cta: string; replay: string; toTop: string };
  toasts: { project: string; detail: string; contact: string };
  artLabel: string;
}
