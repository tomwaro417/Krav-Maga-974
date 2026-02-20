import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const beltSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  isActive: z.boolean().optional()
});

export async function GET(req: Request) {
  await requireAdmin(req);
  const belts = await prisma.belt.findMany({ orderBy: { orderIndex: "asc" } });
  return Response.json({ belts });
}

export async function POST(req: Request) {
  await requireAdmin(req);
  const body = await req.json().catch(() => null);
  const parsed = beltSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const b = parsed.data;
  const belt = await prisma.belt.upsert({
    where: { code: b.code },
    update: { name: b.name, orderIndex: b.orderIndex, isActive: b.isActive ?? true },
    create: { code: b.code, name: b.name, orderIndex: b.orderIndex, isActive: b.isActive ?? true }
  });

  return Response.json({ belt });
}
