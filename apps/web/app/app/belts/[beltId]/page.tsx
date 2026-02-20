import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function BeltDetailPage({ params }: { params: { beltId: string } }) {
  const belt = await prisma.belt.findFirst({
    where: { id: params.beltId, isActive: true },
    include: {
      content: true,
      modules: { where: { isActive: true }, orderBy: { orderIndex: "asc" } }
    }
  });
  if (!belt) return <div>Introuvable</div>;

  return (
    <main className="space-y-4">
      <div className="text-sm text-zinc-600">
        <Link href="/app/belts" className="no-underline hover:underline">Ceintures</Link> / {belt.name}
      </div>
      <h1 className="text-xl font-semibold">{belt.name}</h1>

      {belt.content ? (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">Descriptif</div>
          <div className="mt-2 whitespace-pre-wrap text-zinc-800">{belt.content.contentRich}</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 p-4 text-zinc-600">
          Pas de descriptif long pour cette ceinture.
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm text-zinc-500">Modules</div>
        <div className="grid gap-3">
          {belt.modules.map(m => (
            <Link key={m.id} href={`/app/modules/${m.id}`} className="no-underline">
              <div className="rounded-xl border border-zinc-200 p-3 hover:border-zinc-400">
                <div className="font-medium">{m.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
