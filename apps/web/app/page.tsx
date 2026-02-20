import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-semibold">FEKM — Suivi des connaissances techniques</h1>
      <p className="text-zinc-700">
        Application web (MVP solide) : programme technique, suivi de progression et vidéos (socle prêt à brancher sur S3/CDN).
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href="/login" className="rounded-lg bg-zinc-900 px-4 py-2 text-white no-underline">
          Se connecter
        </Link>
        <Link href="/register" className="rounded-lg border border-zinc-300 px-4 py-2 no-underline">
          Créer un compte
        </Link>
        <Link href="/app" className="rounded-lg border border-zinc-300 px-4 py-2 no-underline">
          Aller à l’app
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700">
        <p className="font-medium">Comptes de démo (seed)</p>
        <ul className="mt-2 list-disc pl-5">
          <li><code className="rounded bg-zinc-100 px-1">admin@example.com</code> / <code className="rounded bg-zinc-100 px-1">admin123!</code> (ADMIN)</li>
          <li><code className="rounded bg-zinc-100 px-1">demo@example.com</code> / <code className="rounded bg-zinc-100 px-1">demo123!</code> (USER)</li>
        </ul>
      </div>
    </main>
  );
}
