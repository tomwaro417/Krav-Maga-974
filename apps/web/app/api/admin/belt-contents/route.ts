import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  beltId: z.string().min(1),
  contentRich: z.string().min(1),
  sourceRef: z.string().optional()
});

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { beltId, contentRich, sourceRef } = parsed.data;

  const saved = await prisma.beltContent.upsert({
    where: { beltId },
    update: { contentRich, sourceRef: sourceRef ?? null, updatedBy: admin.email },
    create: { beltId, contentRich, sourceRef: sourceRef ?? null, updatedBy: admin.email }
  });

  return Response.json({ beltContent: saved });
}
