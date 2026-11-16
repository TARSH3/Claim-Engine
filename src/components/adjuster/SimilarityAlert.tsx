import type { SimilarityResult } from "@/lib/types";
import { day } from "@/lib/format";

const TONE = {
  HIGH: "border-red-300 bg-red-50 text-red-900",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-900",
  LOW: "border-emerald-300 bg-emerald-50 text-emerald-900",
};

export default function SimilarityAlert({ data }: { data: SimilarityResult }) {
  const sev = data.severity;
  return (
    <div className={`rounded-lg border p-4 ${TONE[data.riskLevel]}`}>
      <h3 className="font-semibold">
        {data.riskLevel === "LOW" ? "No strong duplicate signals" : `${data.riskLevel} duplicate / fraud risk`}
      </h3>
      {sev && sev.peerAverage != null && (
        <p className="mt-1 text-sm">
          Severity {sev.score}/10 vs peer average {sev.peerAverage} for this incident type ({sev.peerCount} peers)
          {sev.delta != null && Math.abs(sev.delta) >= 2 ? " — unusual, check the estimate." : "."}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {data.matches.map((m) => (
          <li key={m.claimId} className="rounded bg-white/70 p-3 text-sm text-zinc-800">
            <div className="flex justify-between font-medium">
              <a className="underline" href={`/adjuster/claims/${m.claimId}`}>Claim #{m.claimId}</a>
              <span>risk {(m.riskScore * 100).toFixed(0)}%</span>
            </div>
            <p className="mt-1 text-zinc-600">{m.description}</p>
            <p className="mt-1 text-xs text-zinc-500">
              text similarity {(m.cosineSimilarity * 100).toFixed(0)}% · {m.sameLocation ? "same location" : "different location"} ·{" "}
              {day(m.incidentDate)} ({m.dayGap}d apart)
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
