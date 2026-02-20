import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { importSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  await requireAdmin(req);
  const body = await req.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const payload = parsed.data;

  // Transaction pour cohérence
  const result = await prisma.$transaction(async (tx) => {
    let beltsUpserted = 0;
    let modulesCreated = 0;
    let techniquesCreated = 0;

    for (const b of payload.belts) {
      const belt = await tx.belt.upsert({
        where: { code: b.code },
        update: { name: b.name, orderIndex: b.orderIndex, isActive: b.isActive ?? true },
        create: { code: b.code, name: b.name, orderIndex: b.orderIndex, isActive: b.isActive ?? true }
      });
      beltsUpserted++;

      // Stratégie MVP : on recrée la structure modules/techniques pour cette ceinture
      // (à améliorer ensuite avec diff/merge & soft delete)
      await tx.module.deleteMany({ where: { beltId: belt.id } });

      for (const m of b.modules) {
        const mod = await tx.module.create({
          data: { beltId: belt.id, title: m.title, orderIndex: m.orderIndex, isActive: m.isActive ?? true }
        });
        modulesCreated++;

        for (const t of m.techniques) {
          await tx.technique.create({
            data: {
              moduleId: mod.id,
              title: t.title,
              orderIndex: t.orderIndex,
              descriptionRich: t.descriptionRich ?? null,
              keywords: t.keywords ?? null,
              isActive: t.isActive ?? true
            }
          });
          techniquesCreated++;
        }
      }
    }

    return { beltsUpserted, modulesCreated, techniquesCreated };
  });

  return Response.json({ ok: true, result });
}
