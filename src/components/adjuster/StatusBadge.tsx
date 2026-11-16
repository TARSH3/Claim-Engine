import type { ClaimStatus } from "@/lib/types";

const STYLES: Record<ClaimStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  "Under Review": "bg-blue-100 text-blue-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>{status}</span>;
}
