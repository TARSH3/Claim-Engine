import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { mongoPromise } from '@/lib/mongo';

// POST /api/claims - Member 1 Claim Submission via Stored Procedure & Mongo Logging
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { policy_id, incident_date, claimed_amount, damage_description, photo_urls } = body;

    // Validate inputs
    const numericPolicyId = parseInt(policy_id, 10);
    const numericClaimedAmount = parseFloat(claimed_amount);

    if (!numericPolicyId || isNaN(numericPolicyId)) {
      return NextResponse.json({ error: 'Valid policy_id is required' }, { status: 400 });
    }
    if (!incident_date) {
      return NextResponse.json({ error: 'Incident date is required' }, { status: 400 });
    }
    if (isNaN(numericClaimedAmount) || numericClaimedAmount <= 0) {
      return NextResponse.json({ error: 'Claimed amount must be greater than zero' }, { status: 400 });
    }

    // 1. Invoke Stored Procedure sp_FileClaim in PostgreSQL
    const procResult = await pool.query(
      `CALL sp_FileClaim($1::INT, $2::DATE, $3::NUMERIC, NULL)`,
      [numericPolicyId, incident_date, numericClaimedAmount]
    );

    const createdClaimId = procResult.rows[0]?.p_claim_id;

    // Retrieve the full created claim record
    const latestClaimRes = await pool.query(
      `SELECT c.claim_id, c.claim_number, c.policy_id, c.incident_date, c.claimed_amount, 
              c.status, c.filing_date, p.policy_number, p.policy_type, p.remaining_coverage, p.deductible
       FROM Claims c
       JOIN Policies p ON c.policy_id = p.policy_id
       WHERE c.claim_id = $1 OR (c.policy_id = $2 AND $1 IS NULL)
       ORDER BY c.claim_id DESC 
       LIMIT 1`,
      [createdClaimId || null, numericPolicyId]
    );

    if (latestClaimRes.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to retrieve created claim record' }, { status: 500 });
    }

    const newClaim = latestClaimRes.rows[0];

    // 2. Persist Unstructured Incident Details into MongoDB
    let mongoReportSaved = false;
    try {
      const mongoClient = await mongoPromise;
      const db = mongoClient.db('claims_engine_unstructured');
      
      const photosArray = Array.isArray(photo_urls) 
        ? photo_urls 
        : typeof photo_urls === 'string' && photo_urls.trim() 
          ? photo_urls.split(',').map((u: string) => u.trim()) 
          : [];

      await db.collection('claim_incident_reports').insertOne({
        claim_id: newClaim.claim_id,
        claim_number: newClaim.claim_number,
        policy_id: newClaim.policy_id,
        description: damage_description || 'No initial details provided',
        evidence_photos: photosArray,
        incident_date: new Date(incident_date),
        submitted_at: new Date(),
      });

      // Also mirror into IncidentReports collection used by Member 2 similarity engine
      await db.collection('IncidentReports').insertOne({
        claimId: newClaim.claim_id,
        policyId: newClaim.policy_id,
        incidentType: newClaim.policy_type,
        description: damage_description || 'No initial details provided',
        location: 'Reported by Policyholder',
        incidentDate: new Date(incident_date),
        severityScore: 5,
        photos: photosArray,
        adjusterNotes: [],
        createdAt: new Date(),
      });
      mongoReportSaved = true;
    } catch (mErr: any) {
      console.warn('MongoDB storage skipped/warning:', mErr.message);
    }

    return NextResponse.json(
      {
        message: 'Claim filed successfully via sp_FileClaim',
        claim: newClaim,
        mongoSaved: mongoReportSaved,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Claim filing error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Database Error' },
      { status: err.code === 'P0001' ? 422 : 500 }
    );
  }
}

// GET /api/claims - Member 1 Claim History Retrieval
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('user_id');
    const policyIdParam = searchParams.get('policy_id');

    let query = `
      SELECT 
        c.claim_id,
        c.claim_number,
        c.policy_id,
        c.filing_date,
        c.incident_date,
        c.claimed_amount,
        c.approved_amount,
        c.status,
        c.assigned_adjuster_id,
        p.policy_number,
        p.policy_type,
        p.total_coverage,
        p.remaining_coverage,
        p.deductible,
        u.user_id,
        u.full_name AS policyholder_name,
        u.email AS policyholder_email,
        adj.full_name AS adjuster_name
      FROM Claims c
      JOIN Policies p ON c.policy_id = p.policy_id
      JOIN Users u ON p.user_id = u.user_id
      LEFT JOIN Users adj ON c.assigned_adjuster_id = adj.user_id
    `;

    const conditions: string[] = [];
    const values: any[] = [];

    if (userIdParam) {
      values.push(parseInt(userIdParam, 10));
      conditions.push(`u.user_id = $${values.length}`);
    }

    if (policyIdParam) {
      values.push(parseInt(policyIdParam, 10));
      conditions.push(`p.policy_id = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY c.filing_date DESC, c.claim_id DESC`;

    const { rows } = await pool.query(query, values);
    return NextResponse.json({ claims: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
