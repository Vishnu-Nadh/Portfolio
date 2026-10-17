/* =====================================================================
   SINGLE SOURCE OF CONTENT
   Every piece of copy / data rendered on the site lives here.
   Swap these values for real content; no component needs to change.
   ===================================================================== */
import type { PortfolioData } from "@/types/portfolio";

export const portfolio: PortfolioData = {
  meta: {
    title: "Folio Motion Base",
    description: "Front-end developer portfolio.",
  },

  brand: { first: "First", mark: "L", rest: "astname" },
  heroLines: ["FIRST", "LASTNAME"],
  role: "Front-end developer",
  place: "Your city",
  timeZone: "Asia/Kolkata",

  marquee: ["React", "Design systems", "Motion", "Performance", "SEO", "Accessibility"],

  projects: [
    { lines: ["Project", "Alpha"], year: "2026", type: "Web app", tag: "Live", platform: "React / Next.js", hue: 262 },
    { lines: ["Project", "Bravo"], year: "2025", type: "Design system", tag: "", platform: "TypeScript", hue: 18 },
    { lines: ["Project", "Charlie"], year: "2025", type: "Marketing site", tag: "Live", platform: "React / AWS", hue: 168 },
    { lines: ["Project", "Delta"], year: "2024", type: "Dashboard", tag: "", platform: "React", hue: 330 },
    { lines: ["Project", "Echo"], year: "2023", type: "Prototype", tag: "R&D", platform: "AI / MCP", hue: 205 },
    { lines: ["Project", "Foxtrot"], year: "2022", type: "E-commerce", tag: "", platform: "Shopify", hue: 48 },
  ],

  closeUps: [
    { name: "Alpha", kind: "Mobile", hue: 262 },
    { name: "Alpha", kind: "Detail", hue: 290 },
    { name: "Bravo", kind: "Tokens", hue: 18 },
    { name: "Charlie", kind: "Hero", hue: 168 },
    { name: "Delta", kind: "Charts", hue: 330 },
    { name: "Echo", kind: "Agent UI", hue: 205 },
    { name: "Foxtrot", kind: "Cart", hue: 48 },
  ],

  nav: [
    { label: "Work", target: "work", variant: "link" },
    { label: "About", target: "hello", variant: "link" },
    { label: "Contact", target: "contact", variant: "cta", cursor: "Say hi" },
  ],

  transitions: {
    top: ["Home", "Top"],
    work: ["Work", "Selected projects"],
    hello: ["About", "Hello"],
    contact: ["Contact", "Say hi"],
  },

  hero: {
    eyebrow: "(Portfolio / ©2026)",
    intro: "I build fast, accessible interfaces with a lot of motion in them. Placeholder copy until the real content lands.",
    scrollHint: "↓ Scroll, gently",
    cta: "See the work →",
  },

  work: {
    title: "Selected work",
    years: "2022 — 2026",
    pause: "(Pause motion)",
    play: "(Play motion)",
    rowCta: "View project →",
  },

  closeSection: { title: "(Up close)", hint: "Drag or scroll" },

  hello: {
    eyebrow: "(Hello)",
    statement:
      "I'm a front-end developer. I design and build interfaces that move, respond and feel good to use. Placeholder statement.",
    stats: [
      { label: "Years building", value: 4 },
      { label: "Sites in production", value: 200 },
      { label: "Projects", value: 30 },
    ],
  },

  footer: {
    headline: "Got something in mind?",
    cta: "Let's talk",
    replay: "(Replay intro)",
    toTop: "Back to top ↑",
  },

  toasts: {
    project: "Project page goes here",
    detail: "Detail view goes here",
    contact: "Contact link goes here",
  },

  artLabel: "Placeholder artwork",
};
