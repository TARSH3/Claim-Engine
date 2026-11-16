"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/adjuster/StatusBadge";
import { day, money } from "@/lib/format";
import type { AdjusterClaim } from "@/lib/types";

const FILTERS = ["All", "Pending", "Under Review", "Approved", "Rejected"] as const;

export default function AdjusterPortal() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Pending");
  const [q, setQ] = useState("");
  const [claims, setClaims] = useState<AdjusterClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true); setError("");
      const p = new URLSearchParams();
      if (filter !== "All") p.set("status", filter);
      if (q) p.set("q", q);
      const res = await fetch(`/api/adjuster/claims?${p}`);
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Failed to load"); else setClaims(json.claims);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [filter, q]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Claims Adjuster Portal</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-sm ${filter === f ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
            {f}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search holder or policy…"
          className="ml-auto rounded-md border bg-transparent px-3 py-1.5 text-sm" />
      </div>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
            <tr>{["Claim", "Policyholder", "Policy", "Type", "Claimed", "Remaining coverage", "Claims filed", "Incident", "Status", ""].map((h) => (
              <th key={h} className="px-3 py-2">{h}</th>))}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="p-6 text-center">Loading…</td></tr>
              : claims.length === 0 ? <tr><td colSpan={10} className="p-6 text-center">No claims</td></tr>
              : claims.map((c) => (
                <tr key={c.claim_id} className="border-t">
                  <td className="px-3 py-2 font-medium">#{c.claim_id}</td>
                  <td className="px-3 py-2">{c.full_name}</td>
                  <td className="px-3 py-2">{c.policy_number}</td>
                  <td className="px-3 py-2">{c.claim_type}</td>
                  <td className="px-3 py-2">{money(c.amount_claimed)}</td>
                  <td className="px-3 py-2">{money(c.remaining_coverage)}</td>
                  <td className="px-3 py-2">{c.total_claims_filed}</td>
                  <td className="px-3 py-2">{day(c.incident_date)}</td>
                  <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2"><Link className="underline" href={`/adjuster/claims/${c.claim_id}`}>Review</Link></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
