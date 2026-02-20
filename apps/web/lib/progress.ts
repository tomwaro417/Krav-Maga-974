import type { MasteryLevel } from "@/lib/types";

export function masteryScore(level: MasteryLevel) {
  // Simple ordering for sorting / filtering
  return { NOT_SEEN: 0, SEEN: 1, KNOWN: 2, MASTERED: 3 }[level];
}

export function computeKnownPlusPercent(levels: MasteryLevel[]): number {
  if (levels.length === 0) return 0;
  const knownPlus = levels.filter(l => l === "KNOWN" || l === "MASTERED").length;
  return Math.round((knownPlus / levels.length) * 100);
}

export function computeMasteredPercent(levels: MasteryLevel[]): number {
  if (levels.length === 0) return 0;
  const mastered = levels.filter(l => l === "MASTERED").length;
  return Math.round((mastered / levels.length) * 100);
}
