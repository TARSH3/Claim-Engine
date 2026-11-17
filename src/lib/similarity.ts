import type { Db, Document } from "mongodb";
import { REPORTS } from "./mongo";
import { embedText } from "./embedding";
import type { SimilarityResult, SimilarMatch } from "./types";

export interface Probe {
  claimId: number | null;
  description: string;
  location?: string;
  incidentDate?: Date;
  severityScore?: number;
  incidentType?: string;
}

/** Vector cosine similarity + duplicate heuristics, computed entirely inside MongoDB. */
export function similarityPipeline(probe: Probe, vec: number[]): Document[] {
  const date = probe.incidentDate ?? new Date();
  return [
    { $match: { claimId: { $ne: probe.claimId }, embedding: { $exists: true } } },
    { $addFields: {
        // dot product of two unit vectors = cosine similarity
        cosineSimilarity: { $reduce: {
          input: { $zip: { inputs: ["$embedding", vec] } },
          initialValue: 0,
          in: { $add: ["$$value", { $multiply: [{ $arrayElemAt: ["$$this", 0] }, { $arrayElemAt: ["$$this", 1] }] }] },
        } },
        sameLocation: { $eq: [{ $toLower: "$location" }, (probe.location ?? "").toLowerCase()] },
        dayGap: { $abs: { $dateDiff: { startDate: "$incidentDate", endDate: date, unit: "day" } } },
        severityDiff: { $abs: { $subtract: ["$severityScore", probe.severityScore ?? 0] } },
    } },
    { $addFields: {
        riskScore: { $round: [{ $add: [
          { $multiply: [{ $max: ["$cosineSimilarity", 0] }, 0.6] },
          { $cond: ["$sameLocation", 0.2, 0] },
          { $cond: [{ $lte: ["$dayGap", 7] }, 0.2, 0] },
        ] }, 3] },
    } },
    { $match: { $or: [{ cosineSimilarity: { $gte: 0.4 } }, { riskScore: { $gte: 0.4 } }] } },
    { $sort: { riskScore: -1, cosineSimilarity: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, embedding: 0, adjusterNotes: 0, photos: 0 } },
  ];
}

/** Severity benchmark: how does this claim's severity compare to peers of the same incident type? */
export function severityBenchmarkPipeline(incidentType: string, claimId: number | null): Document[] {
  return [
    { $match: { incidentType, claimId: { $ne: claimId } } },
    { $group: { _id: "$incidentType", peerAverage: { $avg: "$severityScore" }, peerCount: { $sum: 1 } } },
  ];
}

/** Admin overview: same policy + same location filed more than once = duplicate cluster. */
export function duplicateClusterPipeline(): Document[] {
  return [
    { $group: {
        _id: { policyId: "$policyId", location: { $toLower: "$location" } },
        claimIds: { $push: "$claimId" }, dates: { $push: "$incidentDate" }, count: { $sum: 1 },
    } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ];
}

export async function checkSimilarity(db: Db, probe: Probe): Promise<SimilarityResult> {
  const col = db.collection(REPORTS);
  const matches = (await col.aggregate(similarityPipeline(probe, embedText(probe.description))).toArray()) as unknown as SimilarMatch[];

  let severity: SimilarityResult["severity"] = null;
  if (probe.incidentType && probe.severityScore != null) {
    const [b] = await col.aggregate(severityBenchmarkPipeline(probe.incidentType, probe.claimId)).toArray();
    severity = {
      score: probe.severityScore,
      peerAverage: b ? Math.round(b.peerAverage * 10) / 10 : null,
      peerCount: b?.peerCount ?? 0,
      delta: b ? Math.round((probe.severityScore - b.peerAverage) * 10) / 10 : null,
    };
  }
  const top = matches[0]?.riskScore ?? 0;
  return { claimId: probe.claimId, riskLevel: top >= 0.75 ? "HIGH" : top >= 0.5 ? "MEDIUM" : "LOW", matches, severity };
}
