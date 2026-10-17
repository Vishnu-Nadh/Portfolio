import type { Project } from "@/types/portfolio";
import { ProjectLayers } from "@/components/sections/work/ProjectLayers";

/**
 * Fixed card that docks over the work frame and trails the pointer on hover.
 * Rendered outside <main> so main's transition transforms don't re-anchor it.
 */
export function FloatingCard({ projects, artLabel }: { projects: Project[]; artLabel: string }) {
  return (
    <div className="card" aria-hidden="true">
      <ProjectLayers projects={projects} artLabel={artLabel} />
    </div>
  );
}
