import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import type { MasteryLevel } from "@/lib/types";
import { getServerUserOrNull } from "@/lib/server-auth";

function label(m: MasteryLevel) {
  switch (m) {
    case "MASTERED": return "Maîtrise";
    case "KNOWN": return "Connais";
    case "SEEN": return "Vu";
    default: return "Pas encore vu";
  }
}

interface Technique { id: string; title: string }
interface Belt { id: string; name: string }
interface Module {
  id: string;
  title: string;
  belt: Belt;
  techniques: Technique[];
}
interface Progress { techniqueId: string; mastery: string }

export default async function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  const user = await getServerUserOrNull();
  if (!user) return null;

  const mod = await prisma.module.findFirst({
    where: { id: params.moduleId, isActive: true, belt: { isActive: true } },
    include: {
      belt: true,
      techniques: { where: { isActive: true }, orderBy: { orderIndex: "asc" } }
    }
  }) as unknown as Module | null;
  if (!mod) return <div>Introuvable</div>;

  const ids = mod.techniques.map((t: Technique) => t.id);
  const progresses = await prisma.userTechniqueProgress.findMany({
    where: { userId: user.id, techniqueId: { in: ids } }
  }) as unknown as Progress[];
  const pMap = new Map(progresses.map((p: Progress) => [p.techniqueId, p.mastery as MasteryLevel]));

  return (
    <main className="space-y-4">
      <div className="text-sm text-zinc-600">
        <Link href="/app/belts" className="no-underline hover:underline">Ceintures</Link>
        {" "} / <Link href={`/app/belts/${mod.belt.id}`} className="no-underline hover:underline">{mod.belt.name}</Link>
        {" "} / {mod.title}
      </div>
      <h1 className="text-xl font-semibold">{mod.title}</h1>

      <div className="space-y-2">
        {mod.techniques.map((t: Technique) => {
          const m = pMap.get(t.id) ?? "NOT_SEEN";
          return (
            <Link key={t.id} href={`/app/techniques/${t.id}`} className="no-underline">
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 hover:border-zinc-400">
                <div className="font-medium">{t.title}</div>
                <Badge>{label(m)}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
