export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Placeholder artwork background generated from a single hue. */
export const artBackground = (h: number) =>
  `radial-gradient(120% 90% at 18% 8%, hsl(${h} 72% 64% / .95), transparent 60%),` +
  `radial-gradient(100% 80% at 92% 100%, hsl(${(h + 50) % 360} 62% 46% / .92), transparent 56%),` +
  `linear-gradient(160deg, hsl(${h} 32% 15%), hsl(${(h + 30) % 360} 36% 8%))`;
