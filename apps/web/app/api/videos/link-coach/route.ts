import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  techniqueId: z.string().min(1),
  assetId: z.string().min(1)
});

export async function POST(req: Request) {
  await requireAdmin(req);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { techniqueId, assetId } = parsed.data;

  const saved = await prisma.techniqueVideoLink.upsert({
    where: { techniqueId },
    update: { videoAssetId: assetId, isActive: true },
    create: { techniqueId, videoAssetId: assetId, isActive: true }
  });

  return Response.json({ coachLink: { id: saved.id } });
}
