import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeKnownPlusPercent, computeMasteredPercent } from "@/lib/progress";
import type { MasteryLevel } from "@/lib/types";
import { getServerUserOrNull } from "@/lib/server-auth";

export default async function BeltsPage() {
  const user = await getServerUserOrNull();
  if (!user) return null;

  const belts = await prisma.belt.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      modules: {
        where: { isActive: true },
        include: { techniques: { where: { isActive: true }, orderBy: { orderIndex: "asc" } } },
        orderBy: { orderIndex: "asc" }
      },
      content: true
    }
  });

  const allTechniqueIds = belts.flatMap(b => b.modules.flatMap(m => m.techniques.map(t => t.id)));
  const progresses = await prisma.userTechniqueProgress.findMany({
    where: { userId: user.id, techniqueId: { in: allTechniqueIds } }
  });
  const pMap = new Map(progresses.map(p => [p.techniqueId, p.mastery as MasteryLevel]));

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Programme — Ceintures</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {belts.map(b => {
          const levels: MasteryLevel[] = b.modules.flatMap(m => m.techniques.map(t => pMap.get(t.id) ?? "NOT_SEEN"));
          const knownPlus = computeKnownPlusPercent(levels);
          const mastered = computeMasteredPercent(levels);
          const totalTechniques = levels.length;
          return (
            <Link key={b.id} href={`/app/belts/${b.id}`} className="no-underline">
              <div className="rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-zinc-500">{b.code}</div>
                    <div className="text-lg font-semibold">{b.name}</div>
                  </div>
                  <div className="text-sm text-zinc-600">{knownPlus}%</div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={knownPlus} />
                </div>
                <div className="mt-2 flex justify-between text-sm text-zinc-600">
                  <span>{totalTechniques} techniques</span>
                  <span>Maîtrise {mastered}%</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
