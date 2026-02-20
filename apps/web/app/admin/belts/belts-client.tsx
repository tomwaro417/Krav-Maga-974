"use client";

import { useEffect, useState } from "react";

type Belt = { id: string; code: string; name: string; orderIndex: number; isActive: boolean };

export default function BeltsClient() {
  const [belts, setBelts] = useState<Belt[]>([]);
  const [form, setForm] = useState({ code: "", name: "", orderIndex: 0, isActive: true });
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/belts");
    const data = await res.json();
    setBelts(data.belts || []);
  }

  useEffect(() => { refresh(); }, []);

  async function save() {
    setMsg(null);
    const res = await fetch("/api/admin/belts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: form.code.trim(),
        name: form.name.trim(),
        orderIndex: Number(form.orderIndex),
        isActive: !!form.isActive
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("Erreur: " + (data?.error ? JSON.stringify(data.error) : "impossible"));
      return;
    }
    setForm({ code: "", name: "", orderIndex: 0, isActive: true });
    await refresh();
    setMsg("Enregistré.");
    setTimeout(() => setMsg(null), 1500);
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Ceintures</h1>

      <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Code (ex: JAUNE)"
            value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} />
          <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Nom"
            value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Ordre"
            type="number" value={form.orderIndex} onChange={(e) => setForm(f => ({ ...f, orderIndex: Number(e.target.value) }))} />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Actif
          </label>
        </div>

        <button onClick={save} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white">
          Ajouter / mettre à jour
        </button>

        {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
      </div>

      <div className="rounded-2xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="p-2 text-left">Ordre</th>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Nom</th>
              <th className="p-2 text-left">Actif</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {belts.map(b => (
              <tr key={b.id} className="border-t border-zinc-200">
                <td className="p-2">{b.orderIndex}</td>
                <td className="p-2 font-mono">{b.code}</td>
                <td className="p-2">{b.name}</td>
                <td className="p-2">{b.isActive ? "Oui" : "Non"}</td>
                <td className="p-2">
                  <button
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    onClick={() => setForm({ code: b.code, name: b.name, orderIndex: b.orderIndex, isActive: b.isActive })}
                  >
                    Éditer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
