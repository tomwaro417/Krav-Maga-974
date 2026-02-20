import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";

export default async function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  const mod = await prisma.module.findFirst({
    where: { id: params.moduleId, isActive: true, belt: { isActive: true } },
    include: {
      belt: true,
      techniques: { where: { isActive: true }, orderBy: { orderIndex: "asc" } }
    }
  });
  if (!mod) return <div>Introuvable</div>;

  return (
    <main className="space-y-4">
      <div className="text-sm text-zinc-600">
        <Link href="/app/belts" className="no-underline hover:underline">Ceintures</Link>
        {" "} / <Link href={`/app/belts/${mod.belt.id}`} className="no-underline hover:underline">{mod.belt.name}</Link>
        {" "} / {mod.title}
      </div>
      <h1 className="text-xl font-semibold">{mod.title}</h1>

      <div className="space-y-2">
        {mod.techniques.map(t => (
          <Link key={t.id} href={`/app/techniques/${t.id}`} className="no-underline">
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 hover:border-zinc-400">
              <div className="font-medium">{t.title}</div>
              <Badge>Pas encore vu</Badge>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        Note: les badges affichent un placeholder. La vraie valeur vient de <code>/api/modules/:id</code>.
      </p>
    </main>
  );
}
