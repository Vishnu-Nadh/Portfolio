import type { Project } from "@/types/portfolio";
import { pad2 } from "@/lib/format";
import { ProjectLayers } from "./ProjectLayers";

/** Sticky preview frame + counter/progress beside the list (mobile shows its own stage). */
export function Dock({ projects, artLabel }: { projects: Project[]; artLabel: string }) {
  const first = pad2(1);
  return (
    <div className="work__col" aria-hidden="true">
      <div className="dock">
        <div className="dock__frame" data-cursor="View" data-dockframe="">
          <span className="dock__ghost" data-ghost="">
            {first}
          </span>
          <div className="dock__stage" data-stage="">
            <ProjectLayers projects={projects} artLabel={artLabel} />
          </div>
        </div>
        <div className="dock__meta eyebrow">
          <span>
            (
            <span className="dock__cur" data-cur="">
              {first}
            </span>{" "}
            / {pad2(projects.length)})
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
