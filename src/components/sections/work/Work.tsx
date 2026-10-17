import type { PortfolioData } from "@/types/portfolio";
import { pad2 } from "@/lib/format";
import { WorkRow } from "./WorkRow";
import { Dock } from "./Dock";

type WorkProps = Pick<PortfolioData, "projects" | "work" | "toasts" | "artLabel">;

export function Work({ projects, work, toasts, artLabel }: WorkProps) {
  return (
    <section className="work" id="work">
      <div className="work__head eyebrow" data-reveal="">
        <h2 className="eyebrow eyebrow--title">
          {work.title} ({pad2(projects.length)})
        </h2>
        <span className="work__head-end">
          <button type="button" className="work__pause" data-pause="">
            {work.pause}
          </button>
          <span className="work__years">{work.years}</span>
        </span>
      </div>
      <div className="work__grid">
        <div className="work__list" data-list="">
          {projects.map((p, i) => (
            <WorkRow key={i} project={p} index={i} cta={work.rowCta} toast={toasts.project} />
          ))}
          <div className="work__end" />
        </div>
        <Dock projects={projects} artLabel={artLabel} />
      </div>
    </section>
  );
}
