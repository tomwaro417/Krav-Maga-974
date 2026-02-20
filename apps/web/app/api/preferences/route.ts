import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  defaultBeltId: z.string().nullable()
});

export async function GET(req: Request) {
  const user = await requireUser(req);
  const pref = await prisma.userPreference.findUnique({ where: { userId: user.id } });
  return Response.json({ preferences: pref });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const pref = await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: { defaultBeltId: parsed.data.defaultBeltId ?? null },
    create: { userId: user.id, defaultBeltId: parsed.data.defaultBeltId ?? null }
  });

  return Response.json({ ok: true, preferences: pref });
}
