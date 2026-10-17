import type { Project } from "@/types/portfolio";
import { pad2 } from "@/lib/format";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

interface WorkRowProps {
  project: Project;
  index: number;
  cta: string;
  toast: string;
}

export function WorkRow({ project, index, cta, toast }: WorkRowProps) {
  return (
    <a className="row" href="#work" data-cursor="View" data-cursor-tone="dark" data-reveal="" data-toast={toast}>
      <span className="row__num" aria-hidden="true">
        {pad2(index + 1)}
      </span>
      <div className="row__name">
        {project.lines.map((l, i) => (
          <span key={i} className="row__line">
            {l}
          </span>
        ))}
      </div>
      <span className="row__year">
        <span>{project.year}</span>
        <ArrowIcon className="row__arrow" />
      </span>
      <div className="row__meta">
        <span>{project.type}</span>
        {project.tag && <span className="row__tag">({project.tag})</span>}
        <span className="row__cta" aria-hidden="true">
          {cta}
        </span>
      </div>
    </a>
  );
}
