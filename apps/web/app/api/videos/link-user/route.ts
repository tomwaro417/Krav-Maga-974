import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const upsertSchema = z.object({
  techniqueId: z.string().min(1),
  slot: z.enum(["BEGINNER", "PROGRESS"]),
  assetId: z.string().min(1),
  lockAsReference: z.boolean().optional()
});

const deleteSchema = z.object({
  techniqueId: z.string().min(1),
  slot: z.enum(["BEGINNER", "PROGRESS"])
});

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { techniqueId, slot, assetId, lockAsReference } = parsed.data;

  const asset = await prisma.videoAsset.findUnique({ where: { id: assetId } });
  if (!asset) return Response.json({ error: "Unknown assetId" }, { status: 404 });

  const existing = await prisma.userTechniqueVideo.findFirst({
    where: { userId: user.id, techniqueId, slot, isActive: true }
  });

  if (existing) {
    if (slot === "BEGINNER" && existing.isLocked && existing.videoAssetId !== assetId) {
      return Response.json({ error: "Beginner video is locked" }, { status: 409 });
    }
    const updated = await prisma.userTechniqueVideo.update({
      where: { id: existing.id },
      data: {
        videoAssetId: assetId,
        isLocked: lockAsReference ?? existing.isLocked
      }
    });
    return Response.json({ ok: true, userVideo: { id: updated.id } });
  }

  const created = await prisma.userTechniqueVideo.create({
    data: {
      userId: user.id,
      techniqueId,
      slot,
      videoAssetId: assetId,
      isLocked: lockAsReference ?? false,
      isActive: true
    }
  });

  return Response.json({ ok: true, userVideo: { id: created.id } });
}

export async function DELETE(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { techniqueId, slot } = parsed.data;
  await prisma.userTechniqueVideo.updateMany({
    where: { userId: user.id, techniqueId, slot, isActive: true },
    data: { isActive: false, deletedAt: new Date() }
  });

  return Response.json({ ok: true });
}
