"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { money } from "@/lib/format";
import type { Policy } from "@/lib/types";

function NewClaimForm() {
  const searchParams = useSearchParams();
  const preselectedPolicyId = searchParams.get("policy_id");

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(preselectedPolicyId || "");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [claimedAmount, setClaimedAmount] = useState<string>("");
  const [damageDescription, setDamageDescription] = useState<string>("");
  const [photoUrls, setPhotoUrls] = useState<string>("");
  
  const [loadingPolicies, setLoadingPolicies] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successClaim, setSuccessClaim] = useState<any>(null);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const res = await fetch("/api/policies");
        const data = await res.json();
        if (res.ok && data.policies) {
          setPolicies(data.policies);
          if (!selectedPolicyId && data.policies.length > 0) {
            setSelectedPolicyId(data.policies[0].policy_id.toString());
          }
        }
      } catch (err: any) {
        console.error("Error loading policies:", err);
      } finally {
        setLoadingPolicies(false);
      }
    }
    loadPolicies();
  }, [selectedPolicyId]);

  const activePolicy = useMemo(() => {
    return policies.find((p) => p.policy_id.toString() === selectedPolicyId);
  }, [policies, selectedPolicyId]);

  const remainingLimit = activePolicy ? parseFloat(activePolicy.remaining_coverage) : 0;
  const isAmountOverLimit = activePolicy && claimedAmount && parseFloat(claimedAmount) > remainingLimit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedPolicyId) {
      setError("Please select an active policy.");
      return;
    }
    if (!incidentDate) {
      setError("Please select the incident date.");
      return;
    }
    if (incidentDate > todayStr) {
      setError("Validation Error: Incident date cannot be in the future.");
      return;
    }
    const numAmount = parseFloat(claimedAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Validation Error: Claimed amount must be greater than zero.");
      return;
    }
    if (isAmountOverLimit) {
      setError(`Validation Error: Claimed amount (${money(numAmount)}) exceeds the remaining coverage limit (${money(remainingLimit)}).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_id: Number(selectedPolicyId),
          incident_date: incidentDate,
          claimed_amount: numAmount,
          damage_description: damageDescription,
          photo_urls: photoUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit claim.");
      }

      setSuccessClaim(data.claim);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/claimant"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-sm font-semibold transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ←
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">First Notice of Loss (FNOL)</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">File New Insurance Claim • Member 1 Engine</p>
            </div>
          </div>

          <Link
            href="/claimant"
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Cancel & Return
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {successClaim ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm dark:border-emerald-900/50 dark:bg-zinc-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              ✓
            </div>
            <h2 className="mt-4 text-2xl font-bold">Claim Successfully Filed!</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Validated and recorded via PostgreSQL stored procedure <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono dark:bg-zinc-800">sp_FileClaim</code>
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-left text-sm dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-500">Claim Number:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{successClaim.claim_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-500">Policy Number:</span>
                <span className="font-medium">{successClaim.policy_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-500">Claimed Amount:</span>
                <span className="font-bold text-zinc-900 dark:text-white">{money(successClaim.claimed_amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-500">Incident Date:</span>
                <span className="font-medium">{successClaim.incident_date?.split("T")[0]}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Initial Status:</span>
                <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {successClaim.status || "SUBMITTED"}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/claimant"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Go to Policyholder Dashboard
              </Link>
              <button
                onClick={() => {
                  setSuccessClaim(null);
                  setClaimedAmount("");
                  setDamageDescription("");
                  setPhotoUrls("");
                }}
                className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                File Another Claim
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                🛑 {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Step 1: Policy Selection */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  1. Select Target Insurance Policy <span className="text-red-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Must be an active, unexpired policy underwritten in the relational engine.
                </p>

                {loadingPolicies ? (
                  <div className="mt-2 text-xs text-zinc-500">Loading active policies...</div>
                ) : (
                  <select
                    value={selectedPolicyId}
                    onChange={(e) => setSelectedPolicyId(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm font-medium shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {policies.map((p) => (
                      <option key={p.policy_id} value={p.policy_id}>
                        {p.policy_number} — {p.policy_type} (Holder: {p.policyholder_name}) [Remaining: {money(p.remaining_coverage)}]
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected Policy Info Card */}
                {activePolicy && (
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <span className="text-zinc-500">Policy Type:</span>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{activePolicy.policy_type}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Remaining Coverage:</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{money(activePolicy.remaining_coverage)}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Policy Deductible:</span>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{money(activePolicy.deductible)}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Expiration Date:</span>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{activePolicy.end_date?.split("T")[0]}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Incident Date */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  2. Date of Incident <span className="text-red-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-zinc-500">
                  PostgreSQL procedure enforces: <code className="rounded bg-zinc-100 px-1 font-mono text-[11px] dark:bg-zinc-800">incident_date &le; CURRENT_DATE</code>
                </p>
                <input
                  type="date"
                  value={incidentDate}
                  max={todayStr}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  required
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              {/* Step 3: Claimed Amount */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  3. Total Claimed Amount (INR ₹) <span className="text-red-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-zinc-500">
                  PostgreSQL procedure validates that claimed amount does not exceed remaining coverage.
                </p>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 75000"
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(e.target.value)}
                    required
                    className={`block w-full rounded-lg border p-3 pl-8 text-sm shadow-xs focus:outline-hidden ${
                      isAmountOverLimit
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-400"
                        : "border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  />
                </div>
                {isAmountOverLimit && (
                  <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                    ⚠️ Amount exceeds remaining coverage ({money(remainingLimit)}). Procedure will reject!
                  </p>
                )}
              </div>

              {/* Step 4: Damage Description (NoSQL First Notice of Loss) */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  4. Incident & Damage Description (MongoDB Document Store)
                </label>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Stored as unstructured narrative in MongoDB collection <code className="rounded bg-zinc-100 px-1 font-mono text-[11px] dark:bg-zinc-800">claim_incident_reports</code> for NLP / Vector analysis.
                </p>
                <textarea
                  rows={4}
                  placeholder="Describe how the loss occurred, damages sustained, and any police report or witness references..."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              {/* Step 5: Evidence Photos */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  5. Evidence / Damage Photo URLs (Optional)
                </label>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Comma-separated list of image links saved to MongoDB evidence array.
                </p>
                <input
                  type="text"
                  placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                  value={photoUrls}
                  onChange={(e) => setPhotoUrls(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* Submission CTA */}
            <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <Link
                href="/claimant"
                className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || Boolean(isAmountOverLimit)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Executing sp_FileClaim..." : "Submit Claim for Adjudication →"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function NewClaimPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">Loading claim submission form...</div>}>
      <NewClaimForm />
    </Suspense>
  );
}
