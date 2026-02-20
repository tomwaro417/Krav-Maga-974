import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { z } from "zod";

const upsertSchema = z.object({
  beltId: z.string().min(1),
  contentRich: z.string().min(1),
  sourceRef: z.string().optional()
});

export async function GET(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const beltId = url.searchParams.get("beltId");
  if (!beltId) return Response.json({ error: "beltId required" }, { status: 400 });

  const belt = await prisma.belt.findUnique({ where: { id: beltId }, include: { content: true } });
  if (!belt) return new Response("Not found", { status: 404 });

  return Response.json({ belt: { id: belt.id, code: belt.code, name: belt.name }, content: belt.content });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  const body = await req.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { beltId, contentRich, sourceRef } = parsed.data;

  const saved = await prisma.beltContent.upsert({
    where: { beltId },
    update: { contentRich, sourceRef: sourceRef ?? null, updatedBy: admin.email },
    create: { beltId, contentRich, sourceRef: sourceRef ?? null, updatedBy: admin.email }
  });

  await logAdminAction(admin.id, "UPSERT_BELT_CONTENT", { beltId });
  return Response.json({ beltContent: saved });
}
