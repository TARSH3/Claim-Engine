import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const claim_id = body.claim_id ?? body.claimId;
    // Default to an authorized adjuster from seed if not supplied (Ananya Deshmukh, user_id=3)
    const adjuster_id = body.adjuster_id ?? body.adjusterId ?? 3;
    const approved_amount = body.approved_amount ?? body.amount ?? 0;

    if (!claim_id || approved_amount === undefined) {
      return NextResponse.json({ error: 'Missing settlement payload parameters (claim_id and approved_amount are required)' }, { status: 400 });
    }

    // Call Atomic Settlement Procedure
    await pool.query(
      `CALL sp_SettleClaim($1::INT, $2::INT, $3::NUMERIC)`,
      [claim_id, adjuster_id, approved_amount]
    );

    // Retrieve settlement summary
    const payoutDetails = await pool.query(
      `SELECT p.payout_id, p.net_payout, p.disbursement_status, c.status, c.approved_amount 
       FROM Claim_Payouts p
       JOIN Claims c ON p.claim_id = c.claim_id
       WHERE c.claim_id = $1`,
      [claim_id]
    );

    return NextResponse.json({
      message: 'Claim settled and policy limits updated successfully',
      settlement: payoutDetails.rows[0],
      ok: true,
    });
  } catch (err: any) {
    const code = (err as any).code;
    return NextResponse.json({ error: err.message || 'Settlement failed' }, { status: code === 'P0001' ? 422 : 500 });
  }
}
