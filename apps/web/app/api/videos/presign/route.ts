import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  purpose: z.enum(["COACH", "USER_BEGINNER", "USER_PROGRESS"]),
  techniqueId: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive()
});

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  // ⚠️ Stub : ici tu génères une URL pré-signée S3.
  // MVP: on crée juste un VideoAsset en PROCESSING et on renvoie un faux uploadUrl.
  const storageKey = `uploads/${user.id}/${crypto.randomUUID()}`;
  const asset = await prisma.videoAsset.create({
    data: { provider: "S3", storageKey, status: "PROCESSING", format: parsed.data.contentType, size: parsed.data.size }
  });

  return Response.json({
    assetId: asset.id,
    uploadUrl: null, // à brancher (AWS SDK getSignedUrl)
    storageKey
  });
}
