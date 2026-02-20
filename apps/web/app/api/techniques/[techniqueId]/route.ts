import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { techniqueId: string } }) {
  const user = await requireUser(req);

  const technique = await prisma.technique.findFirst({
    where: { id: params.techniqueId, isActive: true, module: { isActive: true, belt: { isActive: true } } },
    include: {
      module: { include: { belt: true } },
      coachVideoLink: { include: { video: true } }
    }
  });
  if (!technique) return new Response("Not found", { status: 404 });

  // Historique (dernier vu)
  await prisma.userTechniqueView.upsert({
    where: { userId_techniqueId: { userId: user.id, techniqueId: technique.id } },
    update: { viewedAt: new Date() },
    create: { userId: user.id, techniqueId: technique.id }
  });

  const progress = await prisma.userTechniqueProgress.findUnique({
    where: { userId_techniqueId: { userId: user.id, techniqueId: technique.id } }
  });

  const userVideos = await prisma.userTechniqueVideo.findMany({
    where: { userId: user.id, techniqueId: technique.id, isActive: true },
    include: { video: true }
  });

  return Response.json({
    technique: {
      id: technique.id,
      title: technique.title,
      descriptionRich: technique.descriptionRich ?? "",
      keywords: technique.keywords ?? "",
      belt: { id: technique.module.belt.id, code: technique.module.belt.code, name: technique.module.belt.name },
      module: { id: technique.module.id, title: technique.module.title },
      mastery: progress?.mastery ?? "NOT_SEEN",
      coachVideo: technique.coachVideoLink?.isActive ? {
        assetId: technique.coachVideoLink.video.id,
        status: technique.coachVideoLink.video.status,
        playbackUrl: null
      } : null,
      myVideos: userVideos.map(v => ({
        slot: v.slot,
        assetId: v.video.id,
        status: v.video.status,
        playbackUrl: null
      }))
    }
  });
}
