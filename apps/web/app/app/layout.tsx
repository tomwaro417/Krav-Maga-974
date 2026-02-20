import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-3">
          <Link href="/app" className="no-underline">
            <span className="text-lg font-semibold">FEKM</span>
          </Link>
          <nav className="text-sm text-zinc-700">
            <Link className="no-underline hover:underline" href="/app">Tableau de bord</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/app/belts">Programme</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/app/search">Recherche</Link>
          </nav>
        </div>
        <div className="text-sm text-zinc-500">
          <span>Auth: stub via en-têtes HTTP</span>
        </div>
      </header>
      {children}
    </div>
  );
}
