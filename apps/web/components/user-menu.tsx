"use client";

import { useState } from "react";

export default function UserMenu({ email, role }: { email: string; role: "USER" | "ADMIN" }) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600">
      <a href="/app/profile" className="hidden sm:block no-underline hover:underline">
        {email || "Mon profil"}
      </a>
      <span className="hidden sm:block text-zinc-300">·</span>
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60"
      >
        {loading ? "…" : "Déconnexion"}
      </button>
      <span className="sr-only">{role}</span>
    </div>
  );
}
