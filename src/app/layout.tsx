import type { Metadata, Viewport } from "next";
import { Hubot_Sans, JetBrains_Mono, Mona_Sans } from "next/font/google";
import { portfolio } from "@/data/portfolio";
import { bootScript } from "@/lib/motion/bootScript";
import "@/styles/main.scss";

// Type rule: Hubot Sans (wide, engineered, space-age) when it is loud; its sibling Mona Sans whenever it
// is being read; JetBrains Mono for labels. The kinetic type animates the wdth + wght axes.
// adjustFontFallback is off so missing glyphs fall through to the stacks in
// styles/abstracts/_tokens.scss rather than a metric-scaled Arial.
const hubot = Hubot_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-hubot",
  display: "swap",
  adjustFontFallback: false,
});

const mona = Mona_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-mona",
  display: "swap",
  adjustFontFallback: false,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: portfolio.meta.title,
  description: portfolio.meta.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // the boot script sets data-* on <html> before hydration
    <html lang="en" className={`${hubot.variable} ${mona.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
