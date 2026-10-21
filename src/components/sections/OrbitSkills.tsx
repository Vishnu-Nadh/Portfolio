import type { CSSProperties } from "react";
import type { PortfolioData } from "@/types/portfolio";
import { pad2 } from "@/lib/format";

type Props = Pick<PortfolioData, "skills">;

/** Planet surface: lit highlight → body hue → deep shadow in the second hue. */
const planetSurface = ([a, b]: [number, number]) =>
  `radial-gradient(circle at 32% 28%, hsl(${a} 90% 82%), hsl(${a} 75% 52%) 40%, hsl(${b} 60% 14%) 100%)`;

/**
 * Orbital skills (pinned scene). Planets are positioned every frame by the orbit module;
 * the orbit ellipses are sized at measure time. The 3D orb parks over the sun.
 */
export function OrbitSkills({ skills }: Props) {
  const { items } = skills;
  return (
    <section className="orbit" id="skills" data-scene="" aria-label="Skills">
      <div className="orbit__pin">
        <div className="orbit__head eyebrow">
          <h2 className="eyebrow eyebrow--title">{skills.title}</h2>
          <span>
            (
            <span className="dock__cur" data-ocur="">
              {pad2(1)}
            </span>{" "}
            / {pad2(items.length)})
          </span>
        </div>

        <div className="orbit__sys" aria-hidden="true">
          <svg className="orbit__svg" data-osvg="">
            <ellipse data-oe="1" className="orbit__e orbit__e--main" />
            <ellipse data-oe="1.38" className="orbit__e orbit__e--dash" />
            <ellipse data-oe="0.65" className="orbit__e orbit__e--in" />
          </svg>
          <div className="orbit__sun" data-osun="" />
        </div>

        <div className="orbit__planets" data-oplanets="">
          {items.map((s) => (
            <button
              key={s.name}
              type="button"
              className="op"
              data-cursor={s.name}
              aria-label={`Show ${s.name}`}
              style={{ "--glow": `hsl(${s.hues[0]} 85% 55% / .55)` } as CSSProperties}
            >
              <span className="op__ball" style={{ background: planetSurface(s.hues) }} />
              <span className="op__lab">{s.name}</span>
            </button>
          ))}
        </div>

        <div className="orbit__text" data-otext="" aria-live="polite">
          {items.map((s) => (
            <div key={s.name} className="ol" aria-hidden="true">
              <h3 className="ol__name">{s.name}</h3>
              <p className="ol__line">{s.line}</p>
              <div className="ol__sat">
                <span className="eyebrow">{skills.satellites}</span>
                <ul className="ol__tools">
                  {s.tools.map((t, j) => (
                    <li key={t} style={{ "--c": `hsl(${s.hues[j % 2]} 80% 62%)` } as CSSProperties}>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="orbit__foot eyebrow">
          <span>{skills.hint}</span>
          <div className="dock__track">
            <div className="dock__bar" data-obar="" />
          </div>
        </div>
      </div>
    </section>
  );
}
