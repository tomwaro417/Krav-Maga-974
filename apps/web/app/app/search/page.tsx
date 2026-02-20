"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { masteryLabel, type MasteryLevel } from "@/lib/types";

type Belt = { id: string; name: string; code: string };
type Result = { id: string; title: string; mastery: MasteryLevel; belt: { id: string; name: string }; module: { id: string; title: string } };

export default function SearchPage() {
  const sp = useSearchParams();
  const initialQ = sp.get("q") ?? "";

  const [q, setQ] = useState(initialQ);
  const [beltId, setBeltId] = useState<string>("");
  const [mastery, setMastery] = useState<string>("");
  const [belts, setBelts] = useState<Belt[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/belts")
      .then(r => r.json())
      .then(d => setBelts((d.belts || []).map((b: any) => ({ id: b.id, name: b.name, code: b.code }))))
      .catch(() => setBelts([]));
  }, []);

  async function run() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (beltId) params.set("beltId", beltId);
    if (mastery) params.set("mastery", mastery);
    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (initialQ) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Recherche</h1>

      <div className="grid gap-2 sm:grid-cols-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une technique…"
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 sm:col-span-2"
        />
        <select
          className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          value={beltId}
          onChange={(e) => setBeltId(e.target.value)}
        >
          <option value="">Toutes ceintures</option>
          {belts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          value={mastery}
          onChange={(e) => setMastery(e.target.value)}
        >
          <option value="">Tous niveaux</option>
          <option value="NOT_SEEN">Pas encore vu</option>
          <option value="SEEN">Vu</option>
          <option value="KNOWN">Connais</option>
          <option value="MASTERED">Maîtrise</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={run} className="rounded-xl border border-zinc-200 px-4 py-2 hover:border-zinc-400">
          {loading ? "…" : "Chercher"}
        </button>
        <div className="text-sm text-zinc-600 self-center">{results.length ? `${results.length} résultats` : ""}</div>
      </div>

      <div className="space-y-2">
        {results.map(r => (
          <Link key={r.id} href={`/app/techniques/${r.id}`} className="no-underline">
            <div className="rounded-xl border border-zinc-200 p-3 hover:border-zinc-400">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{r.title}</div>
                <Badge>{masteryLabel[r.mastery]}</Badge>
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
