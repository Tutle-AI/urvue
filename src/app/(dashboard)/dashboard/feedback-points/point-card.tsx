"use client";

import Link from "next/link";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { POINT_PERSONALITIES, type PointBrief } from "@/lib/feedback-point";

export function PointCard({ point, baseUrl, canEdit }: {
  point: PointBrief & { id: string; slug: string; active: boolean; conversationCount: number };
  baseUrl: string;
  canEdit: boolean;
}) {
  const [showQR, setShowQR] = useState(false);
  const [copyState, setCopyState] = useState("");
  const personality = POINT_PERSONALITIES.find((item) => item.value === point.agentPersona)!;
  const url = `${baseUrl.replace(/\/$/, "")}/feedback/${point.slug}`;
  return (
    <article className="group flex min-w-0 flex-col rounded-3xl border border-border bg-card transition hover:border-muted/40">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between gap-3"><span className="rounded-lg border border-border bg-background/40 px-2.5 py-1.5 text-[11px] text-muted">{point.businessType}</span><span className={`inline-flex items-center gap-1.5 text-[11px] ${point.active ? "text-[#b8c8ab]" : "text-muted"}`}><span className={`h-1.5 w-1.5 rounded-full ${point.active ? "bg-[#a4b696]" : "bg-muted"}`} />{point.active ? "Listening" : "Inactive"}</span></div>
        <Link href={`/dashboard/feedback-points/${point.id}`} className="mt-5 block break-words font-serif text-2xl leading-tight transition hover:text-primary">{point.name}</Link>
        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-relaxed text-muted">{point.description || "Add some context to help your agent understand this experience."}</p>
        <div className="mt-5 border-t border-border pt-4"><p className="text-[10px] uppercase tracking-[0.15em] text-muted">Listening for</p><div className="mt-3 space-y-2">{point.goals.slice(0, 2).map((goal, index) => <p key={index} className="flex gap-2 text-xs leading-relaxed"><span className="text-primary">↳</span><span className="line-clamp-2 break-words">{goal}</span></p>)}{!point.goals.length && <p className="text-xs text-muted">Give your agent a conversation goal.</p>}{point.goals.length > 2 && <p className="pl-4 text-[11px] text-muted">+{point.goals.length - 2} more goal{point.goals.length > 3 ? "s" : ""}</p>}</div></div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-full font-serif ${personality.color}`}>{personality.label[0]}</span><div><p className="text-xs font-medium">{personality.label}</p><p className="text-[10px] text-muted">{personality.detail}</p></div></div><Link href={`/dashboard/sessions?location=${point.id}`} className="text-xs text-muted hover:text-primary">{point.conversationCount} conversation{point.conversationCount === 1 ? "" : "s"} ↗</Link></div>
      </div>
      <div className="border-t border-border px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href={`/dashboard/feedback-points/${point.id}`} className="text-xs font-medium text-primary">{canEdit ? "Edit point" : "View point"} ↗</Link><div className="flex gap-3"><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopyState("Link copied"); } catch { setCopyState("Copy the link below"); } }} className="text-xs text-muted hover:text-foreground">Copy link</button><button type="button" aria-expanded={showQR} aria-controls={`qr-${point.id}`} onClick={() => setShowQR(!showQR)} className="text-xs text-muted hover:text-foreground">{showQR ? "Hide QR" : "QR code"}</button></div></div>
        {copyState && <div role="status" className="mt-3 text-xs text-[#b8c8ab]">{copyState}{copyState === "Copy the link below" && <input aria-label="Feedback link to copy" readOnly value={url} onFocus={(event) => event.target.select()} className="mt-2 w-full rounded border border-border bg-background p-2 text-foreground" />}</div>}
        {showQR && <div id={`qr-${point.id}`} className="mt-4"><div className="flex justify-center rounded-2xl bg-white p-5"><QRCodeSVG value={url} size={160} level="M" title={`Feedback for ${point.name}`} /></div><a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-xs text-primary">Open feedback page ↗</a></div>}
      </div>
    </article>
  );
}
