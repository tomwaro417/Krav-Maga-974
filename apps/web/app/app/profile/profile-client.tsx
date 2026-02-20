"use client";

import { useEffect, useState } from "react";

type Me = { user: { id: string; email: string; role: "USER" | "ADMIN" } | null };

export default function ProfileClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(setMe).catch(() => setMe(null));
  }, []);

  async function exportData() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fekm-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Export téléchargé.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("Supprimer ton compte et tes données ? (action irréversible)")) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (!res.ok) throw new Error("Suppression impossible");
      window.location.href = "/";
    } catch (e: any) {
      setMessage(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Profil</h1>

      <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700">
        <div>Email : <span className="font-medium">{me?.user?.email}</span></div>
        <div>Rôle : <span className="font-medium">{me?.user?.role}</span></div>
      </div>

      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportData}
          disabled={loading}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60"
        >
          Exporter mes données (RGPD)
        </button>

        <button
          onClick={deleteAccount}
          disabled={loading}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-60"
        >
          Supprimer mon compte
        </button>
      </div>
    </main>
  );
}
