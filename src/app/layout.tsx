import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { portfolio } from "@/data/portfolio";
import { bootScript } from "@/lib/motion/bootScript";
import "@/styles/main.scss";

// Archivo with its width axis: the kinetic type animates wdth + wght.
// adjustFontFallback is off so missing glyphs (e.g. →) fall through to the stacks in
// styles/abstracts/_tokens.scss, as on the original page, not a metric-scaled Arial.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-archivo",
  display: "swap",
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
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
    <html lang="en" className={`${archivo.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
