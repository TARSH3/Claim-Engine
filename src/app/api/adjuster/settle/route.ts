import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getDb, REPORTS } from '@/lib/mongo';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const claim_id = body.claim_id ?? body.claimId;
    const adjuster_id = body.adjuster_id ?? body.adjusterId ?? 3;
    const decision = body.decision || "Approved";
    const approved_amount = body.approved_amount ?? body.amount ?? 0;
    const note = body.note || "";

    if (!claim_id) {
      return NextResponse.json({ error: 'claim_id is required' }, { status: 400 });
    }

    if (decision === "Approved") {
      if (approved_amount === undefined || Number(approved_amount) <= 0) {
        return NextResponse.json({ error: 'An approved amount greater than 0 is required for settlement.' }, { status: 400 });
      }

      // Execute Member 2's Atomic Settlement Stored Procedure
      await pool.query(
        `CALL sp_SettleClaim($1::INT, $2::INT, $3::NUMERIC)`,
        [claim_id, adjuster_id, approved_amount]
      );

      // Fetch settlement summary
      const payoutDetails = await pool.query(
        `SELECT p.payout_id, p.net_payout, p.disbursement_status, c.status, c.approved_amount, pol.remaining_coverage
         FROM Claim_Payouts p
         JOIN Claims c ON p.claim_id = c.claim_id
         JOIN Policies pol ON c.policy_id = pol.policy_id
         WHERE c.claim_id = $1`,
        [claim_id]
      );

      // Best-effort mirror note into MongoDB
      if (note) {
        try {
          const db = await getDb();
          await db.collection(REPORTS).updateOne(
            { claimId: Number(claim_id) },
            { $push: { adjusterNotes: { author: "Adjuster", note: `[APPROVED ₹${approved_amount}] ${note}`, createdAt: new Date() } } } as never
          );
        } catch { /* SQL is source of truth */ }
      }

      return NextResponse.json({
        message: 'Claim settled and policy remaining coverage deducted successfully via sp_SettleClaim',
        settlement: payoutDetails.rows[0],
        ok: true,
      });

    } else if (decision === "Rejected") {
      // Mark Claim Rejected
      await pool.query(
        `UPDATE Claims SET status = 'REJECTED', assigned_adjuster_id = $2 WHERE claim_id = $1`,
        [claim_id, adjuster_id]
      );
      return NextResponse.json({ message: 'Claim marked as REJECTED', ok: true });

    } else {
      // Under Review
      await pool.query(
        `UPDATE Claims SET status = 'UNDER_REVIEW', assigned_adjuster_id = $2 WHERE claim_id = $1`,
        [claim_id, adjuster_id]
      );
      return NextResponse.json({ message: 'Claim marked as UNDER_REVIEW', ok: true });
    }
  } catch (err: any) {
    const code = (err as any).code;
    return NextResponse.json({ error: err.message || 'Settlement failed' }, { status: code === 'P0001' ? 422 : 500 });
  }
}
