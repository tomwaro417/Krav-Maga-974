import Link from "next/link";
import { getServerUserOrNull } from "@/lib/server-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUserOrNull();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="no-underline">
            <span className="text-lg font-semibold">Admin FEKM</span>
          </Link>
          <nav className="text-sm text-zinc-700">
            <Link className="no-underline hover:underline" href="/admin/import">Import</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/admin/belts">Ceintures</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/admin/belt-contents">Contenus</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/admin/videos">Vidéos coach</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/app">Retour app</Link>
          </nav>
        </div>
        <div className="text-sm text-zinc-600">{user?.email}</div>
      </header>
      {children}
    </div>
  );
}
