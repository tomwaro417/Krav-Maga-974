import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  techniqueId: z.string().min(1),
  slot: z.enum(["BEGINNER", "PROGRESS"]),
  assetId: z.string().min(1)
});

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { techniqueId, slot, assetId } = parsed.data;

  const saved = await prisma.userTechniqueVideo.upsert({
    where: { userId_techniqueId_slot_deletedAt: { userId: user.id, techniqueId, slot, deletedAt: null } },
    update: { videoAssetId: assetId },
    create: { userId: user.id, techniqueId, slot, videoAssetId: assetId }
  });

  return Response.json({ userVideo: { id: saved.id } });
}

export async function DELETE(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = schema.omit({ assetId: true }).safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { techniqueId, slot } = parsed.data;
  await prisma.userTechniqueVideo.updateMany({
    where: { userId: user.id, techniqueId, slot, deletedAt: null },
    data: { deletedAt: new Date() }
  });

  return Response.json({ ok: true });
}
