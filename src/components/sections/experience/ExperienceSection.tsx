import type { PortfolioData } from "@/types/portfolio";
import { pad2 } from "@/lib/format";
import { ExperienceRow } from "./ExperienceRow";
import { ExperienceDock } from "./ExperienceDock";

export function ExperienceSection({ experience }: Pick<PortfolioData, "experience">) {
  const { items } = experience;
  return (
    <section className="work" id="work">
      <div className="work__head eyebrow" data-reveal="">
        <h2 className="eyebrow eyebrow--title">
          {experience.title} ({pad2(items.length)})
        </h2>
        <span className="work__head-end">
          <button type="button" className="work__pause" data-pause="">
            {experience.pause}
          </button>
          <span className="work__years">{experience.years}</span>
        </span>
      </div>
      <div className="work__grid">
        <div className="work__list" data-list="">
          {items.map((x, i) => (
            <ExperienceRow key={i} item={x} index={i} />
          ))}
          <div className="work__end" />
        </div>
        <ExperienceDock items={items} label={experience.label} />
      </div>
    </section>
  );
}
