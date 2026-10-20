import type { Experience } from "@/types/portfolio";
import { pad2 } from "@/lib/format";

export function ExperienceRow({ item, index }: { item: Experience; index: number }) {
  return (
    <article className="row" data-cursor-tone="dark" data-reveal="">
      <span className="row__num" aria-hidden="true">
        {pad2(index + 1)}
      </span>
      <h3 className="row__name">
        {item.role.map((l, i) => (
          <span key={i} className="row__line">
            {l}
          </span>
        ))}
      </h3>
      <span className="row__year">
        <span>{item.period}</span>
      </span>
      <div className="row__meta">
        <span>{item.company}</span>
        <span>{item.length}</span>
        <span>{item.type}</span>
        {item.tag && <span className="row__tag">({item.tag})</span>}
      </div>
    </article>
  );
}
