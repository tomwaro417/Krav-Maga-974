import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function norm(s: string) { return s.trim().toLowerCase(); }

export async function GET(req: Request) {
  const user = await requireUser(req);

  const url = new URL(req.url);
  const q = norm(url.searchParams.get("q") ?? "");
  const beltId = url.searchParams.get("beltId");
  const moduleId = url.searchParams.get("moduleId");
  const mastery = url.searchParams.get("mastery"); // optionnel

  if (!q && !beltId) {
    return Response.json({ results: [] });
  }

  const techniques = await prisma.technique.findMany({
    where: {
      isActive: true,
      module: {
        isActive: true,
        id: moduleId ?? undefined,
        belt: { isActive: true, id: beltId ?? undefined }
      },
      OR: q ? [
        { title: { contains: q, mode: "insensitive" } },
        { keywords: { contains: q, mode: "insensitive" } }
      ] : undefined
    },
    take: 50,
    orderBy: [{ module: { belt: { orderIndex: "asc" } } }, { module: { orderIndex: "asc" } }, { orderIndex: "asc" }],
    include: { module: { include: { belt: true } } }
  });

  const ids = techniques.map(t => t.id);
  const progresses = await prisma.userTechniqueProgress.findMany({
    where: { userId: user.id, techniqueId: { in: ids } }
  });
  const pMap = new Map(progresses.map(p => [p.techniqueId, p.mastery]));

  const results = techniques
    .map(t => ({
      id: t.id,
      title: t.title,
      belt: { id: t.module.belt.id, code: t.module.belt.code, name: t.module.belt.name },
      module: { id: t.module.id, title: t.module.title },
      mastery: (pMap.get(t.id) ?? "NOT_SEEN")
    }))
    .filter(r => mastery ? r.mastery === mastery : true);

  return Response.json({ results });
}
