import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { progressUpsertSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = progressUpsertSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { techniqueId, mastery, notes } = parsed.data;

  // Lazy creation: upsert
  const updated = await prisma.userTechniqueProgress.upsert({
    where: { userId_techniqueId: { userId: user.id, techniqueId } },
    update: { mastery, notes: notes ?? undefined },
    create: { userId: user.id, techniqueId, mastery, notes: notes ?? undefined }
  });

  return Response.json({ progress: { techniqueId: updated.techniqueId, mastery: updated.mastery, updatedAt: updated.updatedAt } });
}
