import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100 text-zinc-900 dark:from-zinc-950 dark:to-zinc-900 dark:text-zinc-100">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md">
              CE
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">ClaimEngine</span>
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                DBMS Project • Polyglot Architecture
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL Connected
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Enterprise Insurance Claim Engine
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
            A production-ready polyglot architecture combining <strong>PostgreSQL</strong> (ACID ledger, stored procedures, audit triggers, and window views) with <strong>MongoDB</strong> (unstructured FNOL reports & vector embeddings).
          </p>
        </div>

        {/* Portals Split Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Member 1: Claimant Portal */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Member 1 Domain
                </span>
                <span className="font-mono text-xs text-zinc-400">Intake & Policy</span>
              </div>

              <h2 className="mt-5 text-2xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Policyholder Portal
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Active coverage monitoring, policy limit validation, and First Notice of Loss (FNOL) claim submission executed via PostgreSQL stored procedure.
              </p>

              <div className="mt-6 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Stored Procedure: <code className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">sp_FileClaim</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Status Audit Trigger: <code className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">trg_audit_claim_status</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Relational Schema: <code className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">Users, Policies, Claims, History</code>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/claimant"
                className="flex-1 rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Open Policyholder Dashboard →
              </Link>
              <Link
                href="/claimant/new"
                className="rounded-xl border border-zinc-200 px-5 py-3 text-center text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                + File Claim
              </Link>
            </div>
          </div>

          {/* Member 2: Adjuster Workbench */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:border-purple-500 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Member 2 Domain
                </span>
                <span className="font-mono text-xs text-zinc-400">Adjudication & Audit</span>
              </div>

              <h2 className="mt-5 text-2xl font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Adjuster Workbench
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Review pending queue, inspect vector cosine similarity & fraud flags, and execute multi-table atomic settlement transactions.
              </p>

              <div className="mt-6 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> SQL Window View: <code className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">vw_AdjusterPendingClaims</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Atomic Settlement: <code className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">sp_SettleClaim</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> NoSQL Store & Vectors: <code className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">IncidentReports (Mongo)</code>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/adjuster"
                className="block w-full rounded-xl bg-purple-600 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
              >
                Open Adjuster Workbench →
              </Link>
            </div>
          </div>
        </div>

        {/* Database Architecture Summary */}
        <div className="mt-14 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Database Engine Architecture</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/40">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">1. ACID Relational Core</span>
              <p className="mt-1 text-zinc-500">PostgreSQL enforces row-level locks, CHECK constraints, FK integrity, and automated trigger logging.</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/40">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">2. Stored Procedures</span>
              <p className="mt-1 text-zinc-500"><code className="font-mono">sp_FileClaim</code> guards limit overflow; <code className="font-mono">sp_SettleClaim</code> deducts coverage & writes disbursement ledger.</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/40">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">3. Polyglot Document Store</span>
              <p className="mt-1 text-zinc-500">MongoDB stores dynamic First Notice of Loss narratives, photos, and feature-hashed text embeddings.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
