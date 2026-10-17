import type { PortfolioData } from "@/types/portfolio";
import { Art } from "@/components/ui/Art";

type CloseUpProps = Pick<PortfolioData, "closeUps" | "closeSection" | "toasts" | "artLabel">;

/** Horizontal "Up close" strip: scroll-scrubbed + draggable (see closeStrip module). */
export function CloseUp({ closeUps, closeSection, toasts, artLabel }: CloseUpProps) {
  return (
    <section className="close">
      <div className="close__head eyebrow" data-reveal="">
        <h2 className="eyebrow eyebrow--title">{closeSection.title}</h2>
        <span>{closeSection.hint}</span>
      </div>
      <div className="close__wrap" data-closewrap="">
        <div className="close__track" data-closetrack="">
          {closeUps.map(({ name, kind, hue }, i) => (
            <a key={i} className="close__item" href="#work" data-cursor="Look" draggable={false} data-toast={toasts.detail}>
              <div className="close__frame">
                <Art num={name.slice(0, 1)} tag={kind} hue={hue} label={artLabel} />
              </div>
              <div className="close__cap eyebrow">
                <span>{name}</span>
                <span>{kind}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
