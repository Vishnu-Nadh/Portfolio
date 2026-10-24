export type NavTarget = "top" | "skills" | "work" | "hello" | "contact";

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
  /** Two hues (0–360): planet surface/glow and satellite dot colours. */
  hues: [number, number];
  line: string;
  tools: string[];
}

export interface Experience {
  /** Two lines, e.g. ["Front-end", "Developer"]. */
  role: [string, string];
  company: string;
  period: string;
  length: string;
  /** Two hues (0–360); the second colours the station on the trajectory. */
  hues: [number, number];
  summary: string;
  stack: string[];
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
  skills: { title: string; hint: string; satellites: string; items: Skill[] };
  /** Listed newest first; the trajectory travels oldest → newest. */
  experience: {
    title: string;
    years: string;
    hint: string;
    pause: string;
    play: string;
    items: Experience[];
  };
  hello: { eyebrow: string; statement: string; stats: Stat[] };
  footer: { headline: string; cta: string; replay: string; toTop: string };
  /** Intro tagline: rows of words; hollow words render as an accent outline that breathes. */
  intro: { tagline: { text: string; hollow?: boolean }[][]; sub: string };
  /** "Transmission" contact console opened by the footer CTA. */
  contact: {
    eyebrow: string;
    close: string;
    title: string;
    name: string;
    email: string;
    frequency: string;
    topics: { value: string; label: string }[];
    message: string;
    meter: string;
    submit: string;
    submitCursor: string;
    doneTitle: string;
    doneText: string;
    doneBack: string;
  };
}
