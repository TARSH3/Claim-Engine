import type { NextRequest } from "next/server";
import { pool } from "@/lib/db";
import { getDb, REPORTS } from "@/lib/mongo";

// GET /api/adjuster/claims/:id -> SQL row (from the view) + unstructured report (Mongo)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const claimId = Number(id);
  if (!Number.isInteger(claimId)) return Response.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { rows } = await pool.query(
      `SELECT c.*, p.policy_number, p.policy_type, p.total_coverage, p.remaining_coverage, p.deductible,
              u.full_name, u.email, u.phone
       FROM Claims c
       JOIN Policies p ON c.policy_id = p.policy_id
       JOIN Users u ON p.user_id = u.user_id
       WHERE c.claim_id = $1`,
      [claimId]
    );

    if (!rows[0]) return Response.json({ error: "Claim not found" }, { status: 404 });

    let report = null;
    try {
      const db = await getDb();
      report = await db.collection(REPORTS).findOne({ claimId }, { projection: { _id: 0, embedding: 0 } });
      if (!report) {
        report = await db.collection('claim_incident_reports').findOne({ claim_id: claimId }, { projection: { _id: 0 } });
      }
    } catch {
      // Graceful degradation when Mongo is offline
    }

    return Response.json({ claim: rows[0], report });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
