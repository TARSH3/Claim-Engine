import type { NextRequest } from "next/server";
import { getDb, REPORTS } from "@/lib/mongo";
import { checkSimilarity, duplicateClusterPipeline } from "@/lib/similarity";

// POST /api/claims/similarity
//   { claimId }                                   -> compare a stored report with all others
//   { description, location?, incidentDate?, severityScore?, incidentType? }  -> compare new text (e.g. at intake)
//   { mode: "clusters" }                          -> duplicate clusters (same policy + location)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const db = await getDb();
    if (body.mode === "clusters")
      return Response.json({ clusters: await db.collection(REPORTS).aggregate(duplicateClusterPipeline()).toArray() });

    if (Number.isInteger(body.claimId)) {
      const r = await db.collection(REPORTS).findOne({ claimId: body.claimId });
      if (!r) return Response.json({ error: "No incident report for this claim" }, { status: 404 });
      return Response.json(await checkSimilarity(db, {
        claimId: r.claimId, description: r.description, location: r.location,
        incidentDate: r.incidentDate, severityScore: r.severityScore, incidentType: r.incidentType,
      }));
    }
    if (typeof body.description === "string" && body.description.trim())
      return Response.json(await checkSimilarity(db, {
        claimId: null, description: body.description, location: body.location,
        incidentDate: body.incidentDate ? new Date(body.incidentDate) : undefined,
        severityScore: body.severityScore, incidentType: body.incidentType,
      }));
    return Response.json({ error: "Provide claimId, description or mode" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
