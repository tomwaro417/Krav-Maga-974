"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MasteryLevel } from "@/lib/types";
import { masteryLabel } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

type TechniqueApi = {
  technique: {
    id: string;
    title: string;
    descriptionRich: string;
    keywords: string;
    belt: { id: string; code: string; name: string };
    module: { id: string; title: string };
    mastery: MasteryLevel;
    coachVideo: null | { assetId: string; status: string; playbackUrl: string | null };
    myVideos: { slot: "BEGINNER" | "PROGRESS"; assetId: string; status: string; playbackUrl: string | null }[];
  };
};

const levels: MasteryLevel[] = ["NOT_SEEN", "SEEN", "KNOWN", "MASTERED"];

function slotLabel(slot: "BEGINNER" | "PROGRESS") {
  return slot === "BEGINNER" ? "Moi — Débutant" : "Moi — Progression";
}

export default function TechniqueClient(props: {
  techniqueId: string;
  title: string;
  beltName: string;
  moduleTitle: string;
  description: string;
}) {
  const [data, setData] = useState<TechniqueApi | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch(`/api/techniques/${props.techniqueId}`);
    const d = (await res.json()) as TechniqueApi;
    setData(d);
  }

  useEffect(() => { refresh(); }, [props.techniqueId]);

  const mastery = data?.technique.mastery ?? "NOT_SEEN";

  async function update(level: MasteryLevel) {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ techniqueId: props.techniqueId, mastery: level })
    });
    setSaving(false);
    if (!res.ok) {
      setMsg("Erreur lors de la mise à jour.");
      return;
    }
    setData(prev => prev ? ({ ...prev, technique: { ...prev.technique, mastery: level } }) : prev);
    setMsg("Progression mise à jour.");
    setTimeout(() => setMsg(null), 1500);
  }

  async function upload(slot: "BEGINNER" | "PROGRESS", file: File, lockAsReference: boolean) {
    setMsg(null);
    setSaving(true);
    try {
      // 1) presign
      const pres = await fetch("/api/videos/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          purpose: slot === "BEGINNER" ? "USER_BEGINNER" : "USER_PROGRESS",
          techniqueId: props.techniqueId,
          contentType: file.type || "application/octet-stream",
          size: file.size
        })
      });
      const presData = await pres.json();
      if (!pres.ok) throw new Error(presData?.error || "Presign impossible");

      if (!presData.uploadUrl) {
        throw new Error("Stockage S3 non configuré (uploadUrl=null). Configure S3_* dans .env.");
      }

      // 2) upload direct
      const put = await fetch(presData.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file
      });
      if (!put.ok) throw new Error("Upload échoué");

      // 3) mark ready (MVP)
      await fetch("/api/videos/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId: presData.assetId, status: "READY" })
      });

      // 4) link to technique slot
      const link = await fetch("/api/videos/link-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ techniqueId: props.techniqueId, slot, assetId: presData.assetId, lockAsReference })
      });
      const linkData = await link.json();
      if (!link.ok) throw new Error(linkData?.error || "Liaison impossible");

      await refresh();
      setMsg("Vidéo enregistrée.");
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(slot: "BEGINNER" | "PROGRESS") {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/videos/link-user", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ techniqueId: props.techniqueId, slot })
      });
      if (!res.ok) throw new Error("Suppression impossible");
      await refresh();
      setMsg("Vidéo supprimée.");
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const myVideoBySlot = useMemo(() => {
    const map = new Map<"BEGINNER"|"PROGRESS", TechniqueApi["technique"]["myVideos"][0]>();
    for (const v of (data?.technique.myVideos ?? [])) map.set(v.slot, v);
    return map;
  }, [data]);

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
        {saving ? <div className="text-sm text-zinc-500">Traitement…</div> : null}
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
          {(data?.technique.descriptionRich ?? props.description) || "Description à compléter (admin)."}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 space-y-4">
        <div>
          <div className="text-sm text-zinc-500">Coach</div>
          <div className="mt-2 text-sm text-zinc-700">
            {data?.technique.coachVideo
              ? `Vidéo coach: statut ${data.technique.coachVideo.status} (lecture à brancher via CDN/HLS).`
              : "Aucune vidéo coach configurée."}
          </div>
        </div>

        {(["BEGINNER", "PROGRESS"] as const).map((slot) => {
          const v = myVideoBySlot.get(slot);
          return (
            <div key={slot} className="rounded-xl border border-zinc-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{slotLabel(slot)}</div>
                {v ? <span className="text-xs text-zinc-600">statut {v.status}</span> : null}
              </div>

              {v ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => remove(slot)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  >
                    Supprimer
                  </button>
                  <label className="rounded-lg border border-zinc-300 px-3 py-2 text-sm cursor-pointer">
                    Remplacer
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload(slot, f, slot === "BEGINNER");
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <label className="rounded-lg border border-zinc-300 px-3 py-2 text-sm cursor-pointer">
                    Ajouter une vidéo
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload(slot, f, slot === "BEGINNER");
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {slot === "BEGINNER" ? (
                    <p className="text-xs text-zinc-500">Option: la première vidéo débutant peut être verrouillée comme référence.</p>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
