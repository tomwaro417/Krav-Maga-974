"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  mastery: "NOT_SEEN" | "SEEN" | "KNOWN" | "MASTERED";
  technique: { id: string; title: string };
  module: { id: string; title: string };
  belt: { id: string; code: string; name: string };
};

export default function ToWorkClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [mastery, setMastery] = useState<string>(""); // empty=default
  const [loading, setLoading] = useState(false);

  const pageSize = 20;

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (mastery) p.set("mastery", mastery);
    return p.toString();
  }, [page, mastery]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/to-work?${query}`)
      .then(r => r.json())
      .then(data => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">À travailler</h1>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          value={mastery}
          onChange={(e) => { setPage(1); setMastery(e.target.value); }}
        >
          <option value="">Tous (sauf Maîtrise)</option>
          <option value="NOT_SEEN">Pas encore vu</option>
          <option value="SEEN">Vu</option>
          <option value="KNOWN">Connais</option>
        </select>

        <div className="text-sm text-zinc-600">{loading ? "Chargement…" : `${total} techniques`}</div>
      </div>

      <div className="rounded-xl border border-zinc-200">
        <ul className="divide-y divide-zinc-200">
          {items.map((it) => (
            <li key={it.technique.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <a className="no-underline hover:underline" href={`/app/techniques/${it.technique.id}`}>
                  {it.technique.title}
                </a>
                <span className="rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-700">
                  {it.mastery === "NOT_SEEN" ? "Pas encore vu" : it.mastery === "SEEN" ? "Vu" : "Connais"}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {it.belt.name} · {it.module.title}
              </div>
            </li>
          ))}
          {items.length === 0 && !loading ? (
            <li className="p-3 text-sm text-zinc-600">Rien à afficher.</li>
          ) : null}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60"
          disabled={page <= 1 || loading}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          ← Précédent
        </button>
        <div className="text-sm text-zinc-600">Page {page}/{maxPage}</div>
        <button
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60"
          disabled={page >= maxPage || loading}
          onClick={() => setPage(p => Math.min(maxPage, p + 1))}
        >
          Suivant →
        </button>
      </div>
    </main>
  );
}
