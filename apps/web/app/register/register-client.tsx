"use client";

import { useState } from "react";

export default function RegisterClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Inscription impossible");
      window.location.href = "/app";
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Créer un compte</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 p-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-700">Email</label>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-700">Mot de passe</label>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <p className="text-xs text-zinc-500">8 caractères minimum.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>

        <p className="text-sm text-zinc-600">
          Déjà un compte ? <a className="underline" href="/login">Se connecter</a>
        </p>
      </form>
    </main>
  );
}
