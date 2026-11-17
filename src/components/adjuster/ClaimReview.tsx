"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SettleModal from "./SettleModal";
import SimilarityAlert from "./SimilarityAlert";
import StatusBadge from "./StatusBadge";
import { day, money } from "@/lib/format";
import type { AdjusterClaim, IncidentReport, SimilarityResult } from "@/lib/types";

export default function ClaimReview({ id }: { id: string }) {
  const [claim, setClaim] = useState<AdjusterClaim | null>(null);
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [sim, setSim] = useState<SimilarityResult | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/adjuster/claims/${id}`);
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Failed to load claim"); return; }
        setClaim(json.claim);
        setReport(json.report);

        // check duplicate / similar claims via Mongo vector pipeline (best-effort)
        try {
          const sRes = await fetch("/api/claims/similarity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ claimId: Number(id) }),
          });
          if (sRes.ok) setSim(await sRes.json());
        } catch { /* Mongo similarity engine might be offline */ }
      } catch (err: any) {
        setError(err.message || "Failed to load");
      }
    })();
  }, [id, tick]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!claim) return <p className="p-6">Loading…</p>;
  const closed = ["Approved", "Rejected", "SETTLED", "REJECTED"].includes(claim.status);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <Link href="/adjuster" className="text-sm underline">← Back to claims</Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Claim #{claim.claim_id} · {claim.claim_type || "Insurance Claim"}</h1>
          <p className="text-sm text-zinc-500">
            Filed {day(claim.filed_at || claim.filing_date)} · Incident {day(claim.incident_date)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={claim.status} />
          {!closed && <button onClick={() => setOpen(true)} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">Adjudicate / Settle</button>}
        </div>
      </header>

      {sim && <SimilarityAlert data={sim} />}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Policyholder", `${claim.full_name || claim.claimant_name || "—"} (${claim.email || claim.claimant_email || "—"})`],
          ["Policy", `${claim.policy_number} · limit ${money(claim.coverage_limit || claim.total_coverage)}`],
          ["Remaining coverage", money(claim.remaining_coverage)],
          ["Amount claimed", money(claim.amount_claimed || claim.claimed_amount)],
          ["Total claims by holder", claim.total_claims_filed || "1"],
          ["Paid so far on policy", money(claim.total_paid_on_policy || "0")],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border p-3"><p className="text-xs text-zinc-500">{k}</p><p className="font-medium">{v}</p></div>
        ))}
      </section>

      {report ? (
        <>
          <section>
            <h2 className="mb-2 font-semibold">Incident description</h2>
            <p className="rounded-lg border p-4 text-sm">{report.description}</p>
            <p className="mt-1 text-xs text-zinc-500">{report.location || "Location not recorded"} · severity {report.severityScore || 5}/10</p>
          </section>
          {report.photos && report.photos.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">Photos</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {report.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={p} alt="Incident evidence" className="h-40 w-full rounded-lg object-cover" />
                ))}
              </div>
            </section>
          )}
          {report.adjusterNotes && report.adjusterNotes.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">Adjuster notes</h2>
              <ul className="space-y-2">
                {report.adjusterNotes.map((n, i) => (
                  <li key={i} className="rounded-lg border p-3 text-sm">
                    <span className="font-medium">{n.author}</span> <span className="text-xs text-zinc-500">{day(n.createdAt)}</span>
                    <p>{n.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : <p className="text-sm text-zinc-500">No unstructured incident report on file.</p>}

      {claim.adjuster_note && <p className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-800">Decision note: {claim.adjuster_note}</p>}
      {open && <SettleModal claim={claim} onClose={() => setOpen(false)} onDone={() => { setOpen(false); setTick((t) => t + 1); }} />}
    </main>
  );
}
