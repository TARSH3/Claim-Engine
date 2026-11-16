import type { NextRequest } from "next/server";
import { pool } from "@/lib/pg";
import { getDb, REPORTS } from "@/lib/mongo";

// POST /api/adjuster/settle  { claimId, decision: "Approved"|"Rejected"|"Under Review", amount?, note? }
export async function POST(req: NextRequest) {
  const { claimId, decision, amount, note } = await req.json().catch(() => ({}));
  if (!Number.isInteger(claimId) || !["Approved", "Rejected", "Under Review"].includes(decision))
    return Response.json({ error: "claimId (int) and a valid decision are required" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // sp_settle_claim locks claim + policy rows, updates claim, writes ledger, deducts coverage
    const { rows } = await client.query("SELECT * FROM sp_settle_claim($1,$2,$3,$4)", [
      claimId, decision, decision === "Approved" ? amount : null, note ?? null,
    ]);
    await client.query("COMMIT");

    // best-effort: mirror the adjuster's note into the unstructured report
    if (note) {
      try {
        await (await getDb()).collection(REPORTS).updateOne({ claimId }, {
          $push: { adjusterNotes: { author: "Adjuster", note: `[${decision}] ${note}`, createdAt: new Date() } },
        } as never);
      } catch { /* SQL is the source of truth */ }
    }
    return Response.json({ ok: true, result: rows[0] });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    const err = e as { code?: string; message: string };
    // P0001 = RAISE EXCEPTION in sp_settle_claim (business-rule violation)
    return Response.json({ error: err.message }, { status: err.code === "P0001" ? 422 : 500 });
  } finally {
    client.release();
  }
}
