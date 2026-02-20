import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { z } from "zod";

const upsertSchema = z.object({
  techniqueId: z.string().min(1),
  assetId: z.string().min(1)
});

const deleteSchema = z.object({
  techniqueId: z.string().min(1)
});

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  const body = await req.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { techniqueId, assetId } = parsed.data;

  const link = await prisma.techniqueVideoLink.upsert({
    where: { techniqueId },
    update: { videoAssetId: assetId, isActive: true },
    create: { techniqueId, videoAssetId: assetId, isActive: true }
  });

  await logAdminAction(admin.id, "UPSERT_COACH_VIDEO", { techniqueId, assetId });
  return Response.json({ ok: true, link });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { techniqueId } = parsed.data;
  await prisma.techniqueVideoLink.updateMany({
    where: { techniqueId },
    data: { isActive: false }
  });

  await logAdminAction(admin.id, "DISABLE_COACH_VIDEO", { techniqueId });
  return Response.json({ ok: true });
}
