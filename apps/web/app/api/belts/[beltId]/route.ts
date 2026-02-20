import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { MasteryLevel } from "@/lib/types";
import { computeKnownPlusPercent, computeMasteredPercent } from "@/lib/progress";

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
  });
  if (!belt) return new Response("Not found", { status: 404 });

  const techniqueIds = belt.modules.flatMap(m => m.techniques.map(t => t.id));
  const progresses = await prisma.userTechniqueProgress.findMany({
    where: { userId: user.id, techniqueId: { in: techniqueIds } }
  });
  const pMap = new Map(progresses.map(p => [p.techniqueId, p.mastery as MasteryLevel]));

  const modules = belt.modules.map(m => {
    const levels: MasteryLevel[] = m.techniques.map(t => pMap.get(t.id) ?? "NOT_SEEN");
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
