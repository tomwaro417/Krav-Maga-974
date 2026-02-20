import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await requireUser(req);

  const [progresses, videos, prefs] = await Promise.all([
    prisma.userTechniqueProgress.findMany({
      where: { userId: user.id },
      include: { technique: { select: { id: true, title: true, moduleId: true } } }
    }),
    prisma.userTechniqueVideo.findMany({
      where: { userId: user.id },
      include: { technique: { select: { id: true, title: true } }, video: true }
    }),
    prisma.userPreference.findUnique({ where: { userId: user.id } })
  ]);

  return Response.json({
    user: { id: user.id, email: user.email, role: user.role },
    preferences: prefs,
    progresses,
    videos
  });
}
