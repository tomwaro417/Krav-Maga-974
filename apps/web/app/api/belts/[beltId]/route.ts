import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { MasteryLevel } from "@/lib/types";
import { computeKnownPlusPercent, computeMasteredPercent } from "@/lib/progress";

// Types pour les résultats Prisma
interface Technique { id: string; title: string; orderIndex: number }
interface Module { id: string; title: string; orderIndex: number; techniques: Technique[] }
interface Belt { id: string; code: string; name: string; orderIndex: number; content?: { contentRich?: string | null } | null; modules: Module[] }
interface Progress { techniqueId: string; mastery: string }

export async function GET(req: Request, { params }: { params: { beltId: string } }) {
  const user = await requireUser(req);

  const belt = await prisma.belt.findFirst({
    where: { id: params.beltId, isActive: true },
    include: {
      content: true,
      modules: {
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          techniques: { where: { isActive: true }, orderBy: { orderIndex: "asc" } }
        }
      }
    }
  }) as unknown as Belt | null;
  if (!belt) return new Response("Not found", { status: 404 });

  const techniqueIds = belt.modules.flatMap((m: Module) => m.techniques.map((t: Technique) => t.id));
  const progresses = await prisma.userTechniqueProgress.findMany({
    where: { userId: user.id, techniqueId: { in: techniqueIds } }
  }) as unknown as Progress[];
  const pMap = new Map(progresses.map((p: Progress) => [p.techniqueId, p.mastery as MasteryLevel]));

  const modules = belt.modules.map((m: Module) => {
    const levels: MasteryLevel[] = m.techniques.map((t: Technique) => pMap.get(t.id) ?? "NOT_SEEN");
    return {
      id: m.id,
      title: m.title,
      orderIndex: m.orderIndex,
      progress: {
        knownPlusPercent: computeKnownPlusPercent(levels),
        masteredPercent: computeMasteredPercent(levels),
        totalTechniques: levels.length
      }
    };
  });

  return Response.json({
    belt: {
      id: belt.id,
      code: belt.code,
      name: belt.name,
      orderIndex: belt.orderIndex,
      contentRich: belt.content?.contentRich ?? null,
      modules
    }
  });
}
