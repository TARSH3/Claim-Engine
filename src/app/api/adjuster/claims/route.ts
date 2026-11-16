import type { NextRequest } from "next/server";
import { pool } from "@/lib/pg";

const STATUSES = ["Pending", "Under Review", "Approved", "Rejected"];

// GET /api/adjuster/claims?status=Pending&q=aarav
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const where: string[] = [];
  const args: string[] = [];
  if (status && STATUSES.includes(status)) { args.push(status); where.push(`status = $${args.length}`); }
  if (q) { args.push(`%${q}%`); where.push(`(full_name ILIKE $${args.length} OR policy_number ILIKE $${args.length})`); }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM vw_AdjusterPendingClaims ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY filed_at DESC`,
      args,
    );
    return Response.json({ claims: rows });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
