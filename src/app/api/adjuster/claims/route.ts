import { NextResponse, type NextRequest } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status');
    const q = req.nextUrl.searchParams.get('q')?.trim();

    let query = `SELECT * FROM vw_AdjusterPendingClaims`;
    const where: string[] = [];
    const args: any[] = [];

    if (status && status !== 'All') {
      args.push(status);
      where.push(`status = $${args.length}`);
    }

    if (q) {
      args.push(`%${q}%`);
      where.push(`(claimant_name ILIKE $${args.length} OR policy_number ILIKE $${args.length} OR claim_number ILIKE $${args.length})`);
    }

    if (where.length > 0) {
      query += ` WHERE ${where.join(' AND ')}`;
    }

    query += ` ORDER BY filing_date ASC, claim_id ASC`;

    const { rows } = await pool.query(query, args);
    return NextResponse.json({ claims: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
