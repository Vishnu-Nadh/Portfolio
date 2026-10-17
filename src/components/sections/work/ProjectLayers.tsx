import type { Project } from "@/types/portfolio";
import { pad2 } from "@/lib/format";
import { Art } from "@/components/ui/Art";

/** One clip-path layer per project; the engine toggles .is-on on the focused one. */
export function ProjectLayers({ projects, artLabel }: { projects: Project[]; artLabel: string }) {
  return (
    <>
      {projects.map((p, i) => (
        <div key={i} className={i === 0 ? "layer is-on" : "layer"}>
          <Art num={pad2(i + 1)} tag={p.platform} hue={p.hue} label={artLabel} />
        </div>
      ))}
    </>
  );
}
