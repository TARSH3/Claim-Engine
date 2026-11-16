import type { NextRequest } from "next/server";
import { pool } from "@/lib/pg";
import { getDb, REPORTS } from "@/lib/mongo";

// GET /api/adjuster/claims/:id -> SQL row (from the view) + unstructured report (Mongo)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/adjuster/claims/[id]">) {
  const { id } = await ctx.params;
  const claimId = Number(id);
  if (!Number.isInteger(claimId)) return Response.json({ error: "Invalid id" }, { status: 400 });
  try {
    const { rows } = await pool.query("SELECT * FROM vw_AdjusterPendingClaims WHERE claim_id = $1", [claimId]);
    if (!rows[0]) return Response.json({ error: "Claim not found" }, { status: 404 });
    const report = await (await getDb()).collection(REPORTS).findOne({ claimId }, { projection: { _id: 0, embedding: 0 } });
    return Response.json({ claim: rows[0], report });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
