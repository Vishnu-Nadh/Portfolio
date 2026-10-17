import type { PortfolioData } from "@/types/portfolio";

type IntroProps = Pick<PortfolioData, "brand" | "role" | "place">;

/** Preloader lockup; shown while html[data-intro] is set. */
export function Intro({ brand, role, place }: IntroProps) {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro__bg" />
      <div className="intro__lock">
        <div className="intro__logo">
          <span className="intro__clip intro__clip--first">
            {[...brand.first].map((c, i) => (
              <span key={i} className="intro__ch">
                {c.toUpperCase()}
              </span>
            ))}
          </span>
          <span className="intro__box">
            <span data-glyph="">{brand.mark}</span>
          </span>
          <span className="intro__clip intro__clip--rest">
            {[...brand.rest].map((c, i) => (
              <span key={i} className="intro__ch intro__ch--italic" data-italic="1">
                {c}
              </span>
            ))}
          </span>
        </div>
      </div>
      <div className="intro__meta">
        <div className="intro__role eyebrow">
          <span>{role}</span>
          <span>{place}</span>
        </div>
        <span className="intro__count">000</span>
      </div>
      <div className="intro__line" />
    </div>
  );
}
