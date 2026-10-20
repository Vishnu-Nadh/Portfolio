export type NavTarget = "top" | "work" | "hello" | "contact";

export interface Brand {
  /** Upright, uppercase part of the wordmark ("Vishnu"); its first letter sits in an accent box. */
  first: string;
  /** Single glyph shown inside the second accent box ("N"). */
  mark: string;
  /** Italic remainder of the wordmark ("adh"). */
  rest: string;
}

/** A run of hero lead text; bold runs render in the accent colour. */
export interface LeadSegment {
  text: string;
  bold?: boolean;
}

export interface Skill {
  name: string;
  /** Two hues (0–360) for the panel's colour field. */
  hues: [number, number];
  line: string;
  tools: string[];
}

export interface Experience {
  /** Each entry renders on its own line. */
  role: string[];
  company: string;
  period: string;
  length: string;
  type: string;
  /** Optional accent tag, e.g. "Current". Empty string hides it. */
  tag: string;
  /** Two hues (0–360) for the summary panel background. */
  hues: [number, number];
  summary: string;
  stack: string[];
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
  nav: NavLink[];
  /** Big label + sub label shown by the page transition, per nav target. */
  transitions: Record<NavTarget, [label: string, sub: string]>;
  hero: {
    eyebrow: string;
    lead: LeadSegment[];
    cta: string;
    ctaCursor: string;
    more: string;
    /** Numbered strip under the hero. */
    index: string[];
    /** Availability note, one entry per line. */
    open: string[];
  };
  skills: { title: string; hint: string; label: string; items: Skill[] };
  experience: {
    title: string;
    years: string;
    pause: string;
    play: string;
    label: string;
    items: Experience[];
  };
  closeSection: { title: string; hint: string };
  closeUps: CloseUp[];
  hello: { eyebrow: string; statement: string; stats: Stat[] };
  footer: { headline: string; cta: string; replay: string; toTop: string };
  toasts: { detail: string; contact: string };
  artLabel: string;
  sound: { label: string; on: string; off: string };
}
