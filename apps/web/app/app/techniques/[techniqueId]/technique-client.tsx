"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MasteryLevel } from "@/lib/types";
import { masteryLabel } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

const levels: MasteryLevel[] = ["NOT_SEEN", "SEEN", "KNOWN", "MASTERED"];

export default function TechniqueClient(props: {
  techniqueId: string;
  title: string;
  beltName: string;
  moduleTitle: string;
  description: string;
}) {
  const [mastery, setMastery] = useState<MasteryLevel>("NOT_SEEN");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch(`/api/techniques/${props.techniqueId}`, {
      headers: { "x-user-email": "demo@example.com" }
    });
    const data = await res.json();
    setMastery(data.technique.mastery);
  }

  useEffect(() => { refresh(); }, [props.techniqueId]);

  async function update(level: MasteryLevel) {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-email": "demo@example.com"
      },
      body: JSON.stringify({ techniqueId: props.techniqueId, mastery: level })
    });
    setSaving(false);
    if (!res.ok) {
      setMsg("Erreur lors de la mise à jour.");
      return;
    }
    setMastery(level);
    setMsg("Progression mise à jour.");
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <main className="space-y-4">
      <div className="text-sm text-zinc-600">
        <Link href="/app/belts" className="no-underline hover:underline">Ceintures</Link> / {props.beltName} / {props.moduleTitle}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{props.title}</h1>
          <div className="mt-1 text-sm text-zinc-600">
            Statut actuel : <Badge>{masteryLabel[mastery]}</Badge>
          </div>
        </div>
        {saving ? <div className="text-sm text-zinc-500">Sauvegarde…</div> : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <div className="text-sm text-zinc-500">Mettre à jour mon niveau</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => update(l)}
              className={[
                "rounded-full border px-3 py-1 text-sm",
                mastery === l ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"
              ].join(" ")}
            >
              {masteryLabel[l]}
            </button>
          ))}
        </div>
        {msg ? <div className="mt-2 text-sm text-zinc-600">{msg}</div> : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <div className="text-sm text-zinc-500">Fiche technique</div>
        <div className="mt-2 whitespace-pre-wrap text-zinc-800">
          {props.description || "Description à compléter (admin)."}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <div className="text-sm text-zinc-500">Vidéos</div>
        <div className="mt-2 text-sm text-zinc-700">
          Squelette MVP : brancher l’upload pré-signé + affichage HLS.
        </div>
      </div>
    </main>
  );
}
