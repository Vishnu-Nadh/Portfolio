import type { PortfolioData } from "@/types/portfolio";
import { SplitWords } from "@/components/ui/SplitWords";

export function Hello({ hello }: Pick<PortfolioData, "hello">) {
  return (
    <section className="hello" id="hello">
      <span className="eyebrow" data-reveal="">
        {hello.eyebrow}
      </span>
      <SplitWords className="hello__text" text={hello.statement} />
      <div className="hello__stats">
        {hello.stats.map((s, i) => (
          <div key={i} className="stat" data-reveal="">
            <span className="eyebrow">{s.label}</span>
            <span className="stat__n" data-count={s.value}>
              0
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
