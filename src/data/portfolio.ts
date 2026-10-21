/* =====================================================================
   SINGLE SOURCE OF CONTENT
   Every piece of copy / data rendered on the site lives here.
   Swap these values for real content; no component needs to change.
   ===================================================================== */
import type { PortfolioData } from "@/types/portfolio";

export const portfolio: PortfolioData = {
  meta: {
    title: "Folio Draft 3D",
    description: "Front-end developer portfolio.",
  },

  brand: { first: "Vishnu", mark: "N", rest: "adh" },
  heroLines: ["VISHNU", "NADH"],
  role: "Front-end developer",
  place: "Your city",
  timeZone: "Asia/Kolkata",

  nav: [
    { label: "Experience", target: "work", variant: "link" },
    { label: "About", target: "hello", variant: "link" },
    { label: "Contact", target: "contact", variant: "cta", cursor: "Say hi" },
  ],

  transitions: {
    top: ["Home", "Top"],
    work: ["Experience", "Where I've worked"],
    hello: ["About", "Hello"],
    contact: ["Contact", "Say hi"],
  },

  hero: {
    eyebrow: "Hey, I am",
    lead: [
      { text: "I build modern web experiences for product teams, focusing on " },
      { text: "performance, SEO", bold: true },
      { text: " and " },
      { text: "clean design.", bold: true },
    ],
    cta: "View work →",
    ctaCursor: "Browse",
    more: "About me",
    index: ["React", "Next.js", "SEO", "Performance"],
    open: ["Open", "to new", "opportunities"],
  },

  skills: {
    title: "(Skills)",
    hint: "Scroll to orbit · click a planet",
    satellites: "Satellites",
    items: [
      { name: "Build", hues: [332, 12], line: "Component-driven interfaces in React and Next.js, typed end to end.", tools: ["React", "Next.js", "TypeScript", "HTML & CSS"] },
      { name: "Motion", hues: [40, 18], line: "Interaction and animation that responds to pointer and scroll without getting in the way.", tools: ["Web Animations", "GSAP", "Framer Motion", "Lenis"] },
      { name: "Craft", hues: [268, 318], line: "Design systems, accessible markup and layouts that hold up on every screen.", tools: ["Design systems", "Accessibility", "Figma", "Responsive"] },
      { name: "Ship", hues: [350, 44], line: "Fast, findable, tested sites that are easy to deploy and maintain.", tools: ["Performance", "SEO", "Testing", "Vercel"] },
    ],
  },

  /* placeholder roles: replace with real titles, companies, dates, summaries and stacks */
  experience: {
    title: "Experience",
    years: "2022 → Now",
    hint: "Scroll to travel · click a station",
    pause: "(Pause motion)",
    play: "(Play motion)",
    items: [
      {
        role: ["Front-end", "Developer"], company: "Company One", period: "2024 — Now", length: "2 yrs", hues: [262, 312],
        summary: "Lead front-end on the core product. Rebuilt the web app in Next.js, set up the shared component library and cut load times across the main flows.",
        stack: ["React", "Next.js", "TypeScript", "Tailwind", "Vercel"],
      },
      {
        role: ["UI", "Engineer"], company: "Company Two", period: "2023 — 2024", length: "1 yr 4 mos", hues: [330, 20],
        summary: "Built and maintained the design system used by three product teams, from tokens through to documented, accessible components.",
        stack: ["TypeScript", "React", "Storybook", "Figma", "Jest"],
      },
      {
        role: ["Web", "Developer"], company: "Company Three", period: "2022 — 2023", length: "1 yr", hues: [272, 40],
        summary: "Shipped marketing sites and storefronts for clients, with a focus on performance, SEO and smooth, considered motion.",
        stack: ["JavaScript", "Shopify", "GSAP", "HTML & CSS", "AWS"],
      },
    ],
  },

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
    contact: "Contact link goes here",
  },
};
