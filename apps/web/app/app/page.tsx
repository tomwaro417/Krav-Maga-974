import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerUserOrNull } from "@/lib/server-auth";

export default async function Dashboard() {
  const user = await getServerUserOrNull();
  if (!user) return null;

  const totalTechniques = await prisma.technique.count({ where: { isActive: true } });
  const grouped = await prisma.userTechniqueProgress.groupBy({
    by: ["mastery"],
    where: { userId: user.id },
    _count: { mastery: true }
  });

  const counts: Record<string, number> = { NOT_SEEN: 0, SEEN: 0, KNOWN: 0, MASTERED: 0 };
  for (const g of grouped) counts[g.mastery] = g._count.mastery;
  const totalEntries = grouped.reduce((s, g) => s + g._count.mastery, 0);
  const notSeen = (totalTechniques - totalEntries) + (counts.NOT_SEEN || 0);
  const knownPlus = (counts.KNOWN || 0) + (counts.MASTERED || 0);

  const lastViewed = await prisma.userTechniqueView.findMany({
    where: { userId: user.id },
    orderBy: { viewedAt: "desc" },
    take: 8,
    include: { technique: { include: { module: { include: { belt: true } } } } }
  });

  return (
    <main className="space-y-5">
      <h1 className="text-xl font-semibold">Tableau de bord</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">Connais+</div>
          <div className="mt-1 text-2xl font-semibold">{totalTechniques ? Math.round((knownPlus / totalTechniques) * 100) : 0}%</div>
          <div className="text-xs text-zinc-500">{knownPlus}/{totalTechniques} techniques</div>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">Maîtrise</div>
          <div className="mt-1 text-2xl font-semibold">{totalTechniques ? Math.round(((counts.MASTERED || 0) / totalTechniques) * 100) : 0}%</div>
          <div className="text-xs text-zinc-500">{counts.MASTERED || 0}/{totalTechniques} techniques</div>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">À voir / travailler</div>
          <div className="mt-1 text-2xl font-semibold">{notSeen + (counts.SEEN || 0) + (counts.KNOWN || 0)}</div>
          <div className="text-xs text-zinc-500">Pas encore vu, Vu, Connais</div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700">Dernières techniques consultées</h2>
          <Link href="/app/to-work" className="text-sm no-underline hover:underline">À travailler →</Link>
        </div>
        {lastViewed.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">Aucune technique consultée pour l’instant.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lastViewed.map(v => (
              <li key={v.id} className="text-sm">
                <Link className="no-underline hover:underline" href={`/app/techniques/${v.technique.id}`}>
                  {v.technique.title}
                </Link>
                <span className="text-zinc-500"> — {v.technique.module.belt.name} / {v.technique.module.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/app/belts" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm no-underline">
          Programme technique
        </Link>
        <Link href="/app/search" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm no-underline">
          Recherche
        </Link>
        <Link href="/app/profile" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm no-underline">
          Profil / RGPD
        </Link>
      </div>
    </main>
  );
}
