import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { MasteryLevel } from "@/lib/types";

export async function GET(req: Request, { params }: { params: { moduleId: string } }) {
  const user = await requireUser(req);

  const module = await prisma.module.findFirst({
    where: { id: params.moduleId, isActive: true, belt: { isActive: true } },
    include: {
      belt: true,
      techniques: { where: { isActive: true }, orderBy: { orderIndex: "asc" } }
    }
  });
  if (!module) return new Response("Not found", { status: 404 });

  const techniqueIds = module.techniques.map(t => t.id);
  const progresses = await prisma.userTechniqueProgress.findMany({
    where: { userId: user.id, techniqueId: { in: techniqueIds } }
  });
  const pMap = new Map(progresses.map(p => [p.techniqueId, p.mastery as MasteryLevel]));

  return Response.json({
    module: {
      id: module.id,
      title: module.title,
      orderIndex: module.orderIndex,
      belt: { id: module.belt.id, code: module.belt.code, name: module.belt.name },
      techniques: module.techniques.map(t => ({
        id: t.id,
        title: t.title,
        orderIndex: t.orderIndex,
        mastery: pMap.get(t.id) ?? "NOT_SEEN"
      }))
    }
  });
}
