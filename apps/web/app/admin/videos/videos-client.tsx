"use client";

import { useEffect, useState } from "react";

type Result = { id: string; title: string; belt: { name: string }; module: { title: string } };

export default function CoachVideosClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [techniqueId, setTechniqueId] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }

  async function uploadCoach(file: File) {
    if (!techniqueId) {
      setMsg("Choisis d’abord une technique.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const pres = await fetch("/api/videos/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          purpose: "COACH",
          techniqueId,
          contentType: file.type || "application/octet-stream",
          size: file.size
        })
      });
      const presData = await pres.json();
      if (!pres.ok) throw new Error(presData?.error || "Presign impossible");
      if (!presData.uploadUrl) throw new Error("S3 non configuré (uploadUrl=null).");

      const put = await fetch(presData.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file
      });
      if (!put.ok) throw new Error("Upload échoué");

      await fetch("/api/videos/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId: presData.assetId, status: "READY" })
      });

      const link = await fetch("/api/videos/link-coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ techniqueId, assetId: presData.assetId })
      });
      const linkData = await link.json().catch(() => ({}));
      if (!link.ok) throw new Error(linkData?.error || "Liaison impossible");

      setMsg("Vidéo coach associée.");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function unlink() {
    if (!techniqueId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/videos/link-coach", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ techniqueId })
      });
      if (!res.ok) throw new Error("Suppression impossible");
      setMsg("Vidéo coach dissociée.");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setResults([]);
    setTechniqueId("");
  }, []);

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Vidéos coach</h1>

      <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Recherche technique…"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:w-96"
          />
          <button onClick={search} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {loading ? "…" : "Rechercher"}
          </button>
        </div>

        {results.length ? (
          <div className="rounded-xl border border-zinc-200">
            <ul className="divide-y divide-zinc-200">
              {results.slice(0, 10).map(r => (
                <li key={r.id} className="p-3">
                  <button
                    className="text-left w-full"
                    onClick={() => setTechniqueId(r.id)}
                  >
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-zinc-500">{r.belt.name} · {r.module.title}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="text-sm text-zinc-700">
          Technique sélectionnée :{" "}
          <span className="font-mono">{techniqueId || "—"}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="rounded-lg border border-zinc-300 px-3 py-2 text-sm cursor-pointer">
            Uploader & associer une vidéo coach
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCoach(f);
                e.currentTarget.value = "";
              }}
            />
          </label>

          <button
            onClick={unlink}
            disabled={!techniqueId || loading}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60"
          >
            Retirer la vidéo coach
          </button>
        </div>

        {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
      </div>
    </main>
  );
}
