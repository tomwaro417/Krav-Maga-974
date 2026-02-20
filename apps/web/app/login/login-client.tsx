"use client";

import { useState } from "react";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Connexion impossible");
      window.location.href = "/app";
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Connexion</h1>
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
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>

        <p className="text-sm text-zinc-600">
          Pas de compte ? <a className="underline" href="/register">Créer un compte</a>
        </p>
      </form>
    </main>
  );
}
