import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  assetId: z.string().min(1),
  status: z.enum(["READY", "FAILED"]).optional()
});

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const asset = await prisma.videoAsset.findUnique({ where: { id: parsed.data.assetId } });
  if (!asset) return Response.json({ error: "Not found" }, { status: 404 });

  const can = user.role === "ADMIN" || asset.createdByUserId === user.id;
  if (!can) return Response.json({ error: "Forbidden" }, { status: 403 });

  const status = parsed.data.status ?? "READY";
  const updated = await prisma.videoAsset.update({
    where: { id: asset.id },
    data: { status }
  });

  return Response.json({ ok: true, asset: { id: updated.id, status: updated.status } });
}
