import type { Experience } from "@/types/portfolio";
import { pad2 } from "@/lib/format";
import { TiltLayers } from "@/components/ui/TiltLayers";

/** Summary panel background: two hue glows fading into the page colour. */
const experienceBackground = ([a, b]: [number, number]) =>
  `radial-gradient(120% 90% at 18% 8%, hsl(${a} 72% 60%), transparent 62%),` +
  `radial-gradient(100% 80% at 92% 100%, hsl(${b} 72% 52%), transparent 58%),` +
  `linear-gradient(160deg, hsl(${a} 32% 14%), #0b0810)`;

function ExperiencePanel({ item, index, label }: { item: Experience; index: number; label: string }) {
  return (
    <div className={index === 0 ? "layer is-on" : "layer"}>
      <div className="exp" style={{ background: experienceBackground(item.hues) }}>
        <div className="exp__veil" />
        <div className="exp__top">
          <div className="exp__id">
            <span className="exp__lab eyebrow">{label}</span>
            <span className="exp__num">{pad2(index + 1)}</span>
          </div>
          <span className="exp__co">{item.company}</span>
        </div>
        <div className="exp__body">
          {/* mobile only: the list is hidden there, so the card carries the role */}
          <div className="exp__m">
            <h3 className="exp__role">
              {item.role.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </h3>
            <div className="exp__meta eyebrow">
              <span>{item.period}</span>
              <span>{item.length}</span>
              <span>{item.type}</span>
              {item.tag && <span className="row__tag">({item.tag})</span>}
            </div>
          </div>
          <p className="exp__sum">{item.summary}</p>
          <ul className="exp__stack">
            {item.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Sticky tilt card beside the list; panels crossfade as the focused role changes. */
export function ExperienceDock({ items, label }: { items: Experience[]; label: string }) {
  return (
    <div className="work__col" aria-hidden="true">
      <div className="dock">
        <div className="dock__frame c3d" data-dockframe="">
          <div className="dock__stage" data-stage="">
            {items.map((x, i) => (
              <ExperiencePanel key={i} item={x} index={i} label={label} />
            ))}
          </div>
          <TiltLayers />
        </div>
        <div className="dock__meta eyebrow">
          <span>
            (
            <span className="dock__cur" data-cur="">
              {pad2(1)}
            </span>{" "}
            / {pad2(items.length)})
          </span>
          <span data-plat="" />
        </div>
        <div className="dock__track">
          <div className="dock__bar" data-bar="" />
        </div>
      </div>
    </div>
  );
}
