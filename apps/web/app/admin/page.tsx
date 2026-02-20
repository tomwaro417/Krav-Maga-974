import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Admin</h1>
      <p className="text-zinc-700">
        Gestion du référentiel (ceintures/modules/techniques), des contenus Jaune/Orange et des vidéos coach.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/import" className="no-underline">
          <div className="rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400">
            <div className="font-medium">Import programmes techniques</div>
            <div className="mt-1 text-sm text-zinc-600">Prévisualisation + validation (CSV/JSON)</div>
          </div>
        </Link>
        <Link href="/admin/belts" className="no-underline">
          <div className="rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400">
            <div className="font-medium">Ceintures</div>
            <div className="mt-1 text-sm text-zinc-600">CRUD + ordonnancement + activation</div>
          </div>
        </Link>
        <Link href="/admin/belt-contents" className="no-underline">
          <div className="rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400">
            <div className="font-medium">Contenus (Jaune/Orange)</div>
            <div className="mt-1 text-sm text-zinc-600">Éditeur Markdown/texte (accès membres)</div>
          </div>
        </Link>
        <Link href="/admin/videos" className="no-underline">
          <div className="rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400">
            <div className="font-medium">Vidéos coach</div>
            <div className="mt-1 text-sm text-zinc-600">Upload (S3) + assignation technique</div>
          </div>
        </Link>
      </div>
    </main>
  );
}
