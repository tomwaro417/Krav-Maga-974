"use client";

import { useEffect, useState } from "react";

type Belt = { id: string; code: string; name: string };
type Content = { beltId: string; contentRich: string; sourceRef: string | null; updatedBy: string | null; updatedAt: string };

export default function BeltContentsClient() {
  const [belts, setBelts] = useState<Belt[]>([]);
  const [beltId, setBeltId] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [sourceRef, setSourceRef] = useState<string>("");
  const [loaded, setLoaded] = useState<Content | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/belts")
      .then(r => r.json())
      .then(d => setBelts((d.belts || []).map((b: { id: string; code: string; name: string }) => ({ id: b.id, code: b.code, name: b.name }))))
      .catch(() => setBelts([]));
  }, []);

  async function load(id: string) {
    setMsg(null);
    const res = await fetch(`/api/admin/belt-contents?beltId=${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoaded(null);
      setContent("");
      setSourceRef("");
      setMsg("Erreur de chargement");
      return;
    }
    const c = data.content as Content | null;
    setLoaded(c);
    setContent(c?.contentRich || "");
    setSourceRef(c?.sourceRef || "");
  }

  async function save() {
    setMsg(null);
    const res = await fetch("/api/admin/belt-contents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ beltId, contentRich: content, sourceRef: sourceRef || undefined })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("Erreur: " + (data?.error ? JSON.stringify(data.error) : "impossible"));
      return;
    }
    setMsg("Enregistré.");
    setTimeout(() => setMsg(null), 1500);
    await load(beltId);
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Contenus des ceintures</h1>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          value={beltId}
          onChange={(e) => { setBeltId(e.target.value); if (e.target.value) load(e.target.value); }}
        >
          <option value="">Choisir une ceinture…</option>
          {belts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {loaded ? (
          <div className="text-xs text-zinc-500">
            Dernière maj: {new Date(loaded.updatedAt).toLocaleString()} ({loaded.updatedBy || "?"})
          </div>
        ) : null}
      </div>

      {beltId ? (
        <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Source (optionnel)"
            value={sourceRef}
            onChange={(e) => setSourceRef(e.target.value)}
          />
          <textarea
            className="h-80 w-full rounded-xl border border-zinc-200 p-3 font-mono text-xs"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenu riche (Markdown/texte)…"
          />
          <button onClick={save} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white">
            Enregistrer
          </button>
          {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
        </div>
      ) : (
        <div className="text-sm text-zinc-600">Choisis une ceinture pour éditer son contenu.</div>
      )}
    </main>
  );
}
