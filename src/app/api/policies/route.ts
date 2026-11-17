import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('user_id');

    let query = `
      SELECT 
        p.policy_id,
        p.policy_number,
        p.user_id,
        p.policy_type,
        p.total_coverage,
        p.remaining_coverage,
        p.deductible,
        p.start_date,
        p.end_date,
        p.is_active,
        u.full_name AS policyholder_name,
        u.email AS policyholder_email
      FROM Policies p
      JOIN Users u ON p.user_id = u.user_id
      WHERE p.is_active = TRUE
    `;

    const values: any[] = [];
    if (userIdParam) {
      values.push(parseInt(userIdParam, 10));
      query += ` AND p.user_id = $1`;
    }

    query += ` ORDER BY p.policy_id ASC`;

    const { rows } = await pool.query(query, values);
    return NextResponse.json({ policies: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
