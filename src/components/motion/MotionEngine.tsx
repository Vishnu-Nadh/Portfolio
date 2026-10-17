"use client";

import { useEffect } from "react";
import type { PortfolioData } from "@/types/portfolio";
import { createMotionEngine } from "@/lib/motion/engine";

/**
 * Mounts the imperative motion engine on top of the server-rendered markup.
 * Renders nothing; everything animated is plain DOM driven per frame,
 * so React never re-renders during motion.
 */
export function MotionEngine({ data }: { data: PortfolioData }) {
  useEffect(() => createMotionEngine(data), [data]);
  return null;
}
