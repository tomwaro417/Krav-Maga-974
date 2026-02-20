import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { importSchema } from "@/lib/schemas";
import { logAdminAction } from "@/lib/audit";

// Type helper pour la transaction
interface TransactionClient {
  belt: typeof prisma.belt;
  module: typeof prisma.module;
  technique: typeof prisma.technique;
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  const body = await req.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const payload = parsed.data;

  // Dry run: juste compter (sans écrire)
  if (dryRun) {
    const beltsUpserted = payload.belts.length;
    const modulesCreated = payload.belts.reduce((s, b) => s + b.modules.length, 0);
    const techniquesCreated = payload.belts.reduce((s, b) => s + b.modules.reduce((ss, m) => ss + m.techniques.length, 0), 0);
    return Response.json({ ok: true, dryRun: true, result: { beltsUpserted, modulesCreated, techniquesCreated } });
  }

  const result = await prisma.$transaction(async (tx: TransactionClient) => {
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

  await logAdminAction(admin.id, "IMPORT_REFERENTIAL", result);
  return Response.json({ ok: true, result });
}
