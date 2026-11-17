"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/adjuster/StatusBadge";
import { money, day } from "@/lib/format";
import type { Policy, Claim } from "@/lib/types";

export default function PolicyholderDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number>(1);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [polRes, claimRes] = await Promise.all([
          fetch(`/api/policies?user_id=${selectedUserId}`),
          fetch(`/api/claims?user_id=${selectedUserId}`),
        ]);

        const polJson = await polRes.json();
        const claimJson = await claimRes.json();

        if (!polRes.ok) throw new Error(polJson.error || "Failed to load policies");
        if (!claimRes.ok) throw new Error(claimJson.error || "Failed to load claims");

        setPolicies(polJson.policies || []);
        setClaims(claimJson.claims || []);
      } catch (err: any) {
        setError(err.message || "Network error loading dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedUserId]);

  const totalCoverage = policies.reduce((acc, p) => acc + parseFloat(p.total_coverage || "0"), 0);
  const remainingCoverage = policies.reduce((acc, p) => acc + parseFloat(p.remaining_coverage || "0"), 0);
  const activeClaimsCount = claims.filter((c) => ["SUBMITTED", "UNDER_REVIEW", "Pending", "Under Review"].includes(c.status)).length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top Navigation */}
      <header className="border-b border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
              CE
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">ClaimEngine Portal</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Policyholder Services & Coverage Intake</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Policyholder Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">Active User:</span>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 font-medium shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value={1}>Ramesh Kumar (ID #1)</option>
                <option value={2}>Priya Sharma (ID #2)</option>
              </select>
            </div>

            <Link
              href="/claimant/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <span>+</span> File New Claim
            </Link>

            <Link
              href="/adjuster"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Adjuster View ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Overview Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Policies</p>
            <p className="mt-2 text-2xl font-bold">{loading ? "..." : policies.length}</p>
            <p className="mt-1 text-xs text-zinc-400">Underwritten & in-force</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Policy Coverage</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {loading ? "..." : money(totalCoverage)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">Aggregated contractual liability</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Remaining Limit</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : money(remainingCoverage)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">Available for upcoming claims</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Open Claims</p>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {loading ? "..." : activeClaimsCount}
            </p>
            <p className="mt-1 text-xs text-zinc-400">Pending adjudication</p>
          </div>
        </div>

        {/* Active Policies Section */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Your Active Insurance Policies</h2>
              <p className="text-xs text-zinc-500">Verified policies eligible for immediate claims intake</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              Loading policies from database...
            </div>
          ) : policies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              No active policies found for this user account.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {policies.map((p) => {
                const total = parseFloat(p.total_coverage) || 1;
                const remaining = parseFloat(p.remaining_coverage) || 0;
                const percentRemaining = Math.max(0, Math.min(100, (remaining / total) * 100));

                return (
                  <div
                    key={p.policy_id}
                    className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            {p.policy_type}
                          </span>
                          <h3 className="mt-2 text-base font-bold">{p.policy_number}</h3>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        <div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Coverage Remaining:</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {money(p.remaining_coverage)} / {money(p.total_coverage)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${percentRemaining}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
                          <span className="text-zinc-500">Deductible:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{money(p.deductible)}</span>
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Effective Period:</span>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {day(p.start_date)} - {day(p.end_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <Link
                        href={`/claimant/new?policy_id=${p.policy_id}`}
                        className="block w-full rounded-lg bg-zinc-100 py-2 text-center text-xs font-semibold text-zinc-800 transition-colors hover:bg-blue-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-blue-600"
                      >
                        File Claim on This Policy →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Claims Filing & Tracking Table */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Filing & Adjudication History</h2>
              <p className="text-xs text-zinc-500">Real-time status updates tracked via PostgreSQL audit triggers</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-4 py-3">Claim #</th>
                    <th className="px-4 py-3">Policy</th>
                    <th className="px-4 py-3">Incident Date</th>
                    <th className="px-4 py-3">Claimed Amount</th>
                    <th className="px-4 py-3">Approved Payout</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Filing Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                        Loading claim records...
                      </td>
                    </tr>
                  ) : claims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                        No claims filed yet. Click "File New Claim" above to submit your first claim.
                      </td>
                    </tr>
                  ) : (
                    claims.map((c) => (
                      <tr key={c.claim_id} className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {c.claim_number}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{c.policy_number}</div>
                          <div className="text-xs text-zinc-500">{c.policy_type}</div>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">{day(c.incident_date)}</td>
                        <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                          {money(c.claimed_amount)}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          {c.approved_amount && parseFloat(c.approved_amount) > 0 ? money(c.approved_amount) : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-zinc-500">{day(c.filing_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
