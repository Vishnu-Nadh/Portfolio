import type { PortfolioData, Skill } from "@/types/portfolio";
import { pad2 } from "@/lib/format";
import { TiltLayers } from "@/components/ui/TiltLayers";

/** Colour field for a skill card: two soft radial glows over near-black. */
const skillBackground = ([a, b]: [number, number]) =>
  `radial-gradient(75% 70% at 100% 0%, hsl(${a} 70% 46% / 0.85), transparent 70%), radial-gradient(60% 55% at 0% 100%, hsl(${b} 70% 42% / 0.55), transparent 70%), #0d0a12`;

/** One card layer. Child order [bg, big, top, mid, tools] is relied on by the mobile scrub. */
function SkillLayer({ skill, index, label }: { skill: Skill; index: number; label: string }) {
  const on = index === 0;
  return (
    <div className={on ? "skm__l is-on" : "skm__l"} style={{ zIndex: index + 1 }} aria-hidden={on ? "false" : "true"}>
      <div className="skm__bg" style={{ background: skillBackground(skill.hues) }} />
      <span className="skm__big">{pad2(index + 1)}</span>
      <div className="skm__top">
        <span className="skm__lab">{label}</span>
      </div>
      <div className="skm__mid">
        <span className="skm__name">{skill.name}</span>
        <p className="skm__line">{skill.line}</p>
      </div>
      <ul className="skm__tools">
        {skill.tools.map((t, k) => (
          <li key={t} style={{ "--d": `${260 + k * 70}ms` } as React.CSSProperties}>
            <span>{t}</span>
            <i>{String.fromCharCode(97 + k)}</i>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Skills: big names on the right switch the sticky colour-field card on the left. */
export function Skills({ skills }: Pick<PortfolioData, "skills">) {
  const { items } = skills;
  return (
    <section className="skills" id="skills">
      <div className="skills__head eyebrow" data-reveal="">
        <h2 className="eyebrow eyebrow--title">{skills.title}</h2>
        <div className="skills__head-end">
          <span className="skills__hint">{skills.hint}</span>
        </div>
      </div>
      <div className="skills__grid">
        <div className="skills__col">
          <div className="skills__panel c3d" data-skpanel="" aria-live="polite">
            <div className="skm">
              {items.map((s, i) => (
                <SkillLayer key={s.name} skill={s} index={i} label={skills.label} />
              ))}
            </div>
            <TiltLayers />
          </div>
          <div className="dock__meta eyebrow">
            <span>
              (
              <span className="dock__cur" data-skcur="">
                {pad2(1)}
              </span>{" "}
              / {pad2(items.length)})
            </span>
          </div>
          <div className="dock__track">
            <div className="dock__bar" data-skbar="" />
          </div>
        </div>
        <div className="skills__list" data-sklist="">
          {items.map((s, i) => (
            <button key={s.name} type="button" className={i === 0 ? "skills__item is-on" : "skills__item"} aria-pressed={i === 0}>
              <span className="skills__num eyebrow">{pad2(i + 1)}</span>
              <span className="skills__name">
                <span className="skl skl--base">{s.name}</span>
                <span className="skl skl--p" aria-hidden="true">
                  {s.name}
                </span>
                <span className="skl skl--a" aria-hidden="true">
                  {s.name}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
