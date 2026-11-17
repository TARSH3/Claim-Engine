export type UniversalClaimStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SETTLED"
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected";

const STYLES: Record<string, string> = {
  SUBMITTED: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  REJECTED: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  SETTLED: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  Pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  "Under Review": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  Rejected: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
};

export default function StatusBadge({ status }: { status: string }) {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, '_') : 'SUBMITTED';
  const displayLabel = status ? status.replace(/_/g, ' ') : 'SUBMITTED';
  const style = STYLES[status] || STYLES[normalized] || "bg-zinc-100 text-zinc-800 border-zinc-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${style}`}>
      {displayLabel}
    </span>
  );
}
