import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Tableau de bord</h1>
      <p className="text-zinc-700">
        MVP : ajoute ici la synthèse (Known+ / Maîtrise), dernières techniques consultées, et “À travailler”.
      </p>
      <div className="rounded-xl border border-zinc-200 p-4">
        <p className="text-sm text-zinc-600">Raccourcis</p>
        <div className="mt-2 flex gap-3">
          <Link href="/app/belts" className="rounded-lg border border-zinc-200 px-3 py-2 no-underline">Programme technique</Link>
          <Link href="/app/search" className="rounded-lg border border-zinc-200 px-3 py-2 no-underline">Recherche</Link>
        </div>
      </div>
    </main>
  );
}
