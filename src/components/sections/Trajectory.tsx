import type { CSSProperties } from "react";
import type { PortfolioData } from "@/types/portfolio";
import { pad2 } from "@/lib/format";

type Props = Pick<PortfolioData, "experience">;

/**
 * Trajectory experience (pinned scene). The path, stations and probe are laid out by the trajectory
 * module; scroll travels oldest → newest, so stations and panels render in reverse list order.
 */
export function Trajectory({ experience }: Props) {
  const { items } = experience;
  // [original index, item] from oldest to newest
  const route = items.map((x, i) => [i, x] as const).reverse();
  return (
    <section className="traj" id="work" data-scene="" aria-label="Experience">
      <div className="traj__pin">
        <div className="orbit__head eyebrow">
          <h2 className="eyebrow eyebrow--title">
            ({experience.title} {pad2(items.length)})
          </h2>
          <span className="work__head-end">
            {/* hidden in the design; still wired to the motion toggle */}
            <button type="button" className="work__pause" data-pause="" hidden tabIndex={-1} aria-hidden="true">
              {experience.pause}
            </button>
            <span>{experience.years}</span>
          </span>
        </div>

        <div className="traj__cam" data-tcam="">
          <svg className="traj__svg" data-tsvg="" aria-hidden="true">
            <defs>
              <linearGradient id="trajG" gradientUnits="userSpaceOnUse" data-tgrad="">
                {/* violet → accent → accent-2, from the theme tokens */}
                <stop offset="0" style={{ stopColor: "var(--violet)" }} stopOpacity="0.25" />
                <stop offset="0.6" style={{ stopColor: "var(--accent)" }} />
                <stop offset="1" style={{ stopColor: "var(--accent-2)" }} />
              </linearGradient>
            </defs>
            <path className="traj__ghost" data-tghost="" />
            <path className="traj__path" data-tpath="" />
            <path className="traj__line" data-tline="" stroke="url(#trajG)" />
          </svg>
          <div data-tstations="">
            {route.map(([i, x]) => (
              <button
                key={i}
                type="button"
                className="ts"
                data-cursor={x.company}
                aria-label={`Show ${x.role.join(" ")}`}
                style={{ "--c": `hsl(${x.hues[1]} 85% 62%)` } as CSSProperties}
              >
                <span className="ts__ring" />
                <span className="ts__core" />
                <span className="ts__tag">
                  <span>{pad2(i + 1)}</span>
                  <i>{x.period}</i>
                </span>
              </button>
            ))}
          </div>
          <div className="traj__probe" data-tprobe="" aria-hidden="true" />
        </div>

        <div className="traj__text" data-ttext="" aria-live="polite">
          {route.map(([i, x]) => (
            <div key={i} className="ol" aria-hidden="true">
              <div className="ol__meta eyebrow">
                <span>{x.company}</span>
                <i>·</i>
                <span>{x.period}</span>
                <i>·</i>
                <span>{x.length}</span>
              </div>
              <h3 className="ol__role">
                {x.role[0]}
                <br />
                {x.role[1]}
              </h3>
              <p className="ol__line">{x.summary}</p>
              <ul className="ol__stack">
                {x.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="orbit__foot eyebrow">
          <span>{experience.hint}</span>
          <div className="dock__track">
            <div className="dock__bar" data-tbar="" />
          </div>
        </div>
      </div>
    </section>
  );
}
