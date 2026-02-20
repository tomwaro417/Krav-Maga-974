import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeKnownPlusPercent, computeMasteredPercent } from "@/lib/progress";
import type { MasteryLevel } from "@/lib/types";

export default async function BeltsPage() {
  // ⚠️ MVP sans auth côté UI. En prod, filtre par user connecté.
  const belts = await prisma.belt.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      modules: {
        where: { isActive: true },
        include: { techniques: { where: { isActive: true } } }
      }
    }
  });

  // Pas de user ici => 0%. La vraie prog est côté API / utilisateur.
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Programme — Ceintures</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {belts.map(b => (
          <Link key={b.id} href={`/app/belts/${b.id}`} className="no-underline">
            <div className="rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-zinc-500">{b.code}</div>
                  <div className="text-lg font-semibold">{b.name}</div>
                </div>
                <div className="text-sm text-zinc-600">0%</div>
              </div>
              <div className="mt-3">
                <ProgressBar value={0} />
              </div>
              <div className="mt-2 text-sm text-zinc-600">
                {b.modules.reduce((acc, m) => acc + m.techniques.length, 0)} techniques
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        Note: la progression réelle est calculée côté API avec l’utilisateur (voir <code>/api/belts</code>).
      </p>
    </main>
  );
}
