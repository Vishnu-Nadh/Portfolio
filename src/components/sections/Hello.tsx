import type { PortfolioData } from "@/types/portfolio";
import { SplitWords } from "@/components/ui/SplitWords";

/** About "signal" (pinned): the statement lights up word by word; stat lines fill in after it. */
export function Hello({ hello }: Pick<PortfolioData, "hello">) {
  return (
    <section className="hello" id="hello" data-scene="">
      <div className="hello__pin">
        <span className="eyebrow" data-reveal="">
          {hello.eyebrow}
        </span>
        <SplitWords className="hello__text" text={hello.statement} />
        <div className="hello__stats">
          {hello.stats.map((s, i) => (
            <div key={i} className="stat" data-reveal="">
              <span className="stat__line" aria-hidden="true">
                <i />
              </span>
              <span className="eyebrow">{s.label}</span>
              <span className="stat__n" data-count={s.value}>
                0
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
