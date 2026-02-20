import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

interface GroupedResult {
  mastery: string;
  _count: { mastery: number };
}

interface Belt {
  id: string;
  code: string;
  name: string;
}

interface Module {
  id: string;
  title: string;
  belt: Belt;
}

interface Technique {
  id: string;
  title: string;
  module: Module;
}

interface LastViewedItem {
  viewedAt: Date;
  technique: Technique;
}

export async function GET(req: Request) {
  const user = await requireUser(req);

  const totalTechniques = await prisma.technique.count({ where: { isActive: true } });

  const grouped = await prisma.userTechniqueProgress.groupBy({
    by: ["mastery"],
    where: { userId: user.id },
    _count: { mastery: true }
  }) as unknown as GroupedResult[];

  const counts: Record<string, number> = { NOT_SEEN: 0, SEEN: 0, KNOWN: 0, MASTERED: 0 };
  for (const g of grouped) counts[g.mastery] = g._count.mastery;

  const totalEntries = grouped.reduce((s: number, g: GroupedResult) => s + g._count.mastery, 0);
  const notSeen = (totalTechniques - totalEntries) + (counts.NOT_SEEN || 0);

  const knownPlus = (counts.KNOWN || 0) + (counts.MASTERED || 0);

  const lastViewed = await prisma.userTechniqueView.findMany({
    where: { userId: user.id },
    orderBy: { viewedAt: "desc" },
    take: 10,
    include: {
      technique: {
        include: { module: { include: { belt: true } } }
      }
    }
  }) as unknown as LastViewedItem[];

  return Response.json({
    kpi: {
      totalTechniques,
      notSeen,
      seen: counts.SEEN || 0,
      known: counts.KNOWN || 0,
      mastered: counts.MASTERED || 0,
      knownPlusPercent: totalTechniques ? Math.round((knownPlus / totalTechniques) * 100) : 0,
      masteredPercent: totalTechniques ? Math.round(((counts.MASTERED || 0) / totalTechniques) * 100) : 0
    },
    lastViewed: lastViewed.map((v: LastViewedItem) => ({
      viewedAt: v.viewedAt,
      technique: { id: v.technique.id, title: v.technique.title },
      module: { id: v.technique.module.id, title: v.technique.module.title },
      belt: { id: v.technique.module.belt.id, name: v.technique.module.belt.name, code: v.technique.module.belt.code }
    }))
  });
}
