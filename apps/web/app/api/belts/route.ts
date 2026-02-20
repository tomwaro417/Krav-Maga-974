import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { computeKnownPlusPercent, computeMasteredPercent } from "@/lib/progress";
import type { MasteryLevel } from "@/lib/types";

// Types pour les résultats Prisma
interface Technique { id: string }
interface Module { techniques: Technique[] }
interface Belt { modules: Module[] }

export async function GET(req: Request) {
  const user = await requireUser(req);

  const belts = await prisma.belt.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      modules: {
        where: { isActive: true },
        include: {
          techniques: { where: { isActive: true }, orderBy: { orderIndex: "asc" } }
        },
        orderBy: { orderIndex: "asc" }
      },
      content: true
    }
  }) as unknown as Belt[];

  // Récupérer les progressions existantes de l'utilisateur
  const allTechniqueIds = belts.flatMap((b: Belt) => b.modules.flatMap((m: Module) => m.techniques.map((t: Technique) => t.id)));
  const progresses = await prisma.userTechniqueProgress.findMany({
    where: { userId: user.id, techniqueId: { in: allTechniqueIds } }
  });
  const pMap = new Map(progresses.map(p => [p.techniqueId, p.mastery as MasteryLevel]));

  const withProgress = belts.map(b => {
    const levels: MasteryLevel[] = b.modules.flatMap((m: Module) => m.techniques.map((t: Technique) => pMap.get(t.id) ?? "NOT_SEEN"));
    return {
      id: b.id,
      code: b.code,
      name: b.name,
      orderIndex: b.orderIndex,
      hasContent: !!b.content,
      progress: {
        knownPlusPercent: computeKnownPlusPercent(levels),
        masteredPercent: computeMasteredPercent(levels),
        totalTechniques: levels.length
      }
    };
  });

  return Response.json({ belts: withProgress });
}
