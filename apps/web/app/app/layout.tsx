import Link from "next/link";
import { getServerUserOrNull } from "@/lib/server-auth";
import UserMenu from "@/components/user-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUserOrNull();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app" className="no-underline">
            <span className="text-lg font-semibold">FEKM</span>
          </Link>
          <nav className="text-sm text-zinc-700">
            <Link className="no-underline hover:underline" href="/app">Tableau de bord</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/app/belts">Programme</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/app/to-work">À travailler</Link>{" "}
            ·{" "}
            <Link className="no-underline hover:underline" href="/app/search">Recherche</Link>
            {user?.role === "ADMIN" ? (
              <>
                {" "}·{" "}
                <Link className="no-underline hover:underline" href="/admin">Admin</Link>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <form action="/app/search" className="hidden sm:block">
            <input
              name="q"
              placeholder="Rechercher une technique…"
              className="w-64 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              defaultValue=""
            />
          </form>
          <UserMenu email={user?.email ?? ""} role={user?.role ?? "USER"} />
        </div>
      </header>

      {children}
    </div>
  );
}
