"use client";

import { useState } from "react";

interface ImportResult {
  beltsUpserted: number;
  modulesCreated: number;
  techniquesCreated: number;
}

export default function ImportClient() {
  const [fileText, setFileText] = useState<string>("");
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadSample() {
    setError(null);
    const res = await fetch("/import/fekm-programs.json");
    const txt = await res.text();
    setFileText(txt);
    setPreview(null);
    setResult(null);
  }

  async function runPreview() {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const payload = JSON.parse(fileText);
      const res = await fetch("/api/admin/import?dryRun=1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Preview impossible");
      setPreview(data.result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function runImport() {
    if (!confirm("Importer et remplacer la structure modules/techniques des ceintures concernées ?")) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = JSON.parse(fileText);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Import impossible");
      setResult(data.result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Import programmes techniques</h1>

      <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={loadSample}>
            Charger l’exemple FEKM (PDF → JSON)
          </button>
          <label className="rounded-lg border border-zinc-300 px-3 py-2 text-sm cursor-pointer">
            Charger un fichier JSON…
            <input
              className="hidden"
              type="file"
              accept="application/json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const txt = await f.text();
                setFileText(txt);
                setPreview(null);
                setResult(null);
                setError(null);
              }}
            />
          </label>
        </div>

        <textarea
          value={fileText}
          onChange={(e) => setFileText(e.target.value)}
          placeholder='Colle ici le JSON (voir docs/import-format.md)…'
          className="h-72 w-full rounded-xl border border-zinc-200 p-3 font-mono text-xs"
        />

        <div className="flex flex-wrap gap-2">
          <button
            disabled={!fileText || loading}
            onClick={runPreview}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60"
          >
            {loading ? "…" : "Prévisualiser"}
          </button>
          <button
            disabled={!fileText || loading}
            onClick={runImport}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? "…" : "Importer"}
          </button>
        </div>

        {error ? <div className="text-sm text-red-700">{error}</div> : null}
        {preview ? (
          <div className="text-sm text-zinc-700">
            <div className="font-medium">Prévisualisation</div>
            <pre className="mt-2 rounded-lg bg-zinc-50 p-3 text-xs">{JSON.stringify(preview, null, 2)}</pre>
          </div>
        ) : null}
        {result ? (
          <div className="text-sm text-zinc-700">
            <div className="font-medium">Import terminé</div>
            <pre className="mt-2 rounded-lg bg-zinc-50 p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </main>
  );
}
