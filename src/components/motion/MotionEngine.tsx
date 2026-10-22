"use client";

import { useEffect } from "react";
import type { PortfolioData } from "@/types/portfolio";
import { createMotionEngine } from "@/lib/motion/engine";
import { preloadThree } from "@/lib/motion/modules/scene3d";

// start fetching three.js as soon as this chunk evaluates, ahead of hydration and the engine mount,
// so the 3D stage is ready (or nearly) when the intro begins
if (typeof window !== "undefined") preloadThree();

/**
 * Mounts the imperative motion engine on top of the server-rendered markup.
 * Renders nothing; everything animated is plain DOM driven per frame,
 * so React never re-renders during motion.
 */
export function MotionEngine({ data }: { data: PortfolioData }) {
  useEffect(() => createMotionEngine(data), [data]);
  return null;
}
