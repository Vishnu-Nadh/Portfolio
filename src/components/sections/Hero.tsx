import type { LeadSegment, PortfolioData } from "@/types/portfolio";

type HeroProps = Pick<PortfolioData, "heroLines" | "hero">;

interface LeadChar {
  ch: string;
  bold: boolean;
}

/** Splits the lead into words of characters; spaces stay as plain text so lines wrap naturally. */
function splitLead(lead: LeadSegment[]) {
  const words: LeadChar[][] = [];
  let word: LeadChar[] | null = null;
  lead.forEach(({ text, bold = false }) => {
    [...text].forEach((ch) => {
      if (ch === " ") {
        word = null;
        words.push([]); // a space marker
        return;
      }
      if (!word) {
        word = [];
        words.push(word);
      }
      word.push({ ch, bold });
    });
  });
  return words;
}

/** First screen: kinetic name, lead copy that rises letter by letter, actions and a skills index strip. */
export function Hero({ heroLines, hero }: HeroProps) {
  const leadText = hero.lead.map((s) => s.text).join("").trim();
  let charIndex = 0;

  return (
    <section className="hero" id="top">
      <div className="hero__body">
        <div className="hero__namecol">
          <span className="hero__eyebrow eyebrow" data-reveal="">
            {hero.eyebrow}
          </span>
          <h1 className="hero__name" aria-label={heroLines.join(" ")}>
            {heroLines.map((line, i) => (
              <span key={i} className={i ? "hero__line hero__line--hollow" : "hero__line"} aria-hidden="true">
                {[...line].map((ch, j) => (
                  <span key={j} className="kl" data-ch={ch} data-in="">
                    <span className="kl__a" data-ch={ch} aria-hidden="true" />
                  </span>
                ))}
                {i === heroLines.length - 1 && <span className="hero__ul" />}
              </span>
            ))}
          </h1>
        </div>
        <div className="hero__rule" aria-hidden="true" />
        <div className="hero__copy">
          <span className="hero__dash" aria-hidden="true" data-reveal="" />
          <p className="hero__intro" aria-label={leadText}>
            {splitLead(hero.lead).map((word, i) =>
              word.length === 0 ? (
                " "
              ) : (
                <span key={i} className="hero__word" aria-hidden="true">
                  {word.map(({ ch, bold }, j) => {
                    const d = 80 + 11 * charIndex++;
                    return (
                      <span key={j} className={bold ? "hero__ch hero__ch--b" : "hero__ch"} data-pin="" data-d={d} data-b={bold ? "1" : ""}>
                        {ch}
                      </span>
                    );
                  })}
                </span>
              ),
            )}
          </p>
          <div className="hero__actions" data-reveal="">
            <a className="btn btn--solid" href="#work" data-nav="work" data-magnet="" data-cursor={hero.ctaCursor}>
              {hero.cta}
            </a>
            <a className="hero__more" href="#hello" data-nav="hello">
              {hero.more}
            </a>
          </div>
        </div>
      </div>
      <div className="hero__index" data-reveal="">
        <div className="hero__skills">
          {hero.index.map((s, i) => (
            <div key={s} className="hero__skill">
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <b>{s}</b>
            </div>
          ))}
        </div>
        <p className="hero__open eyebrow">
          {hero.open.map((l, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {l}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
