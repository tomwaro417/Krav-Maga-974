"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { masteryLabel, type MasteryLevel } from "@/lib/types";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
      headers: { "x-user-email": "demo@example.com" }
    });
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Recherche</h1>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une technique…"
          className="w-full rounded-xl border border-zinc-200 px-3 py-2"
        />
        <button onClick={run} className="rounded-xl border border-zinc-200 px-4 py-2 hover:border-zinc-400">
          {loading ? "…" : "Chercher"}
        </button>
      </div>

      <div className="space-y-2">
        {results.map(r => (
          <Link key={r.id} href={`/app/techniques/${r.id}`} className="no-underline">
            <div className="rounded-xl border border-zinc-200 p-3 hover:border-zinc-400">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{r.title}</div>
                <Badge>{masteryLabel[r.mastery as MasteryLevel]}</Badge>
              </div>
              <div className="mt-1 text-sm text-zinc-600">{r.belt.name} · {r.module.title}</div>
            </div>
          </Link>
        ))}
        {results.length === 0 && !loading ? <div className="text-sm text-zinc-500">Aucun résultat.</div> : null}
      </div>
    </main>
  );
}
