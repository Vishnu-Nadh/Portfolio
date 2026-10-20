import type { Metadata, Viewport } from "next";
import { Anybody, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { portfolio } from "@/data/portfolio";
import { bootScript } from "@/lib/motion/bootScript";
import "@/styles/main.scss";

// Type rule: Anybody when it is loud (big, uppercase), Bricolage whenever it is being read,
// JetBrains Mono for labels and buttons. The kinetic type animates Anybody's wdth + wght axes.
// adjustFontFallback is off so missing glyphs fall through to the stacks in
// styles/abstracts/_tokens.scss rather than a metric-scaled Arial.
const anybody = Anybody({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-anybody",
  display: "swap",
  adjustFontFallback: false,
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
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
    <html lang="en" className={`${anybody.variable} ${bricolage.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
