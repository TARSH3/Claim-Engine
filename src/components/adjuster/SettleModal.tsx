"use client";
import { useState } from "react";
import { money } from "@/lib/format";
import type { AdjusterClaim } from "@/lib/types";

export default function SettleModal({
  claim, onClose, onDone,
}: { claim: AdjusterClaim; onClose: () => void; onDone: () => void }) {
  const claimedAmt = Number(claim.amount_claimed || claim.claimed_amount || 0);
  const remainingCov = Number(claim.remaining_coverage || 0);
  const max = Math.min(claimedAmt, remainingCov);

  const [decision, setDecision] = useState<"Approved" | "Rejected" | "Under Review">("Approved");
  const [amount, setAmount] = useState(String(max > 0 ? max : claimedAmt));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError("");
    const approvedVal = decision === "Approved" ? Number(amount) : 0;
    const res = await fetch("/api/adjuster/settle", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        claimId: claim.claim_id,
        claim_id: claim.claim_id,
        decision, 
        amount: approvedVal,
        approved_amount: approvedVal,
        adjuster_id: 3, // Authorized Adjuster ID
        note 
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Failed to settle claim");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 text-zinc-900 shadow-xl">
        <h2 className="text-lg font-semibold">Adjudication for Claim #{claim.claim_id}</h2>
        <p className="text-sm text-zinc-600">
          Claimed {money(claimedAmt)} · Remaining Coverage {money(remainingCov)}
        </p>
        <div className="flex gap-2">
          {(["Approved", "Rejected", "Under Review"] as const).map((d) => (
            <button key={d} onClick={() => setDecision(d)}
              className={`flex-1 rounded-md border px-2 py-1.5 text-sm ${decision === d ? "border-zinc-900 bg-zinc-900 text-white" : "hover:bg-zinc-100"}`}>
              {d}
            </button>
          ))}
        </div>
        {decision === "Approved" && (
          <label className="block text-sm">Settlement Payout Amount (max {money(max)})
            <input type="number" min={1} max={max} value={amount} onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-semibold" />
          </label>
        )}
        <label className="block text-sm">Adjuster Audit Note
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Enter reason for decision, damage assessment..."
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </label>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm hover:bg-zinc-100">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? "Processing sp_SettleClaim..." : "Confirm & Settle"}
          </button>
        </div>
      </div>
    </div>
  );
}
