"use client";
import { useState } from "react";
import { money } from "@/lib/format";
import type { AdjusterClaim } from "@/lib/types";

export default function SettleModal({
  claim, onClose, onDone,
}: { claim: AdjusterClaim; onClose: () => void; onDone: () => void }) {
  const max = Math.min(Number(claim.amount_claimed), Number(claim.remaining_coverage));
  const [decision, setDecision] = useState<"Approved" | "Rejected" | "Under Review">("Approved");
  const [amount, setAmount] = useState(String(max));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError("");
    const res = await fetch("/api/adjuster/settle", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId: claim.claim_id, decision, amount: Number(amount), note }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Failed");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 text-zinc-900 shadow-xl">
        <h2 className="text-lg font-semibold">Decision for claim #{claim.claim_id}</h2>
        <p className="text-sm text-zinc-600">
          Claimed {money(claim.amount_claimed)} · Remaining coverage {money(claim.remaining_coverage)}
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
          <label className="block text-sm">Settlement amount (max {money(max)})
            <input type="number" min={1} max={max} value={amount} onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
        )}
        <label className="block text-sm">Adjuster note
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm hover:bg-zinc-100">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">
            {busy ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
