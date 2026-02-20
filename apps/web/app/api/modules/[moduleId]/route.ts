import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

interface Module {
  id: string;
  title: string;
  orderIndex: number;
  belt: {
    id: string;
    code: string;
    name: string;
  };
}

interface Technique {
  id: string;
  title: string;
  descriptionRich: string | null;
  orderIndex: number;
}

export async function GET(req: Request, { params }: { params: { moduleId: string } }) {
  const user = await requireUser(req);

  const moduleItem = await prisma.module.findFirst({
    where: { id: params.moduleId, isActive: true, belt: { isActive: true } },
    include: {
      belt: true,
      techniques: { where: { isActive: true }, orderBy: { orderIndex: "asc" } }
    }
  }) as unknown as Module & { techniques: Technique[] } | null;
  if (!moduleItem) return new Response("Not found", { status: 404 });

  const techniqueIds = moduleItem.techniques.map((t: Technique) => t.id);
  const progresses = await prisma.userTechniqueProgress.findMany({
    where: { userId: user.id, techniqueId: { in: techniqueIds } }
  });
  const pMap = new Map(progresses.map((p: { techniqueId: string; mastery: string }) => [p.techniqueId, p.mastery]));

  return Response.json({
    module: {
      id: moduleItem.id,
      title: moduleItem.title,
      orderIndex: moduleItem.orderIndex,
      belt: { id: moduleItem.belt.id, code: moduleItem.belt.code, name: moduleItem.belt.name }
    },
    techniques: moduleItem.techniques.map((t: Technique) => ({
      id: t.id,
      title: t.title,
      descriptionRich: t.descriptionRich ?? "",
      orderIndex: t.orderIndex,
      mastery: pMap.get(t.id) ?? "NOT_SEEN"
    }))
  });
}
