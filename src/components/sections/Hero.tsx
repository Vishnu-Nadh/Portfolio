import type { PortfolioData } from "@/types/portfolio";

type HeroProps = Pick<PortfolioData, "heroLines" | "role" | "place" | "hero">;

/** First screen. Each name letter is a .kl span the engine drives per glyph. */
export function Hero({ heroLines, role, place, hero }: HeroProps) {
  return (
    <section className="hero" id="top">
      <div className="hero__top eyebrow" data-reveal="">
        <span>{hero.eyebrow}</span>
        <span>{role}</span>
        <span>{place}</span>
      </div>
      <h1 className="hero__name" aria-label={heroLines.join(" ")}>
        {heroLines.map((line, i) => (
          <span key={i} className={i ? "hero__line hero__line--r" : "hero__line"} aria-hidden="true">
            {[...line].map((ch, j) => (
              <span key={j} className="kl" data-ch={ch} data-in="" />
            ))}
          </span>
        ))}
      </h1>
      <div className="hero__bottom">
        <p className="hero__intro" data-reveal="">
          {hero.intro}
        </p>
        <span className="hero__scroll eyebrow" data-reveal="">
          {hero.scrollHint}
        </span>
        <div className="hero__end" data-reveal="">
          <a className="btn" href="#work" data-nav="work" data-magnet="" data-cursor="Go">
            {hero.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
