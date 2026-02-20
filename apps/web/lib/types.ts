export type MasteryLevel = "NOT_SEEN" | "SEEN" | "KNOWN" | "MASTERED";

export const masteryLabel: Record<MasteryLevel, string> = {
  NOT_SEEN: "Pas encore vu",
  SEEN: "Vu",
  KNOWN: "Connais",
  MASTERED: "Maîtrise"
};
