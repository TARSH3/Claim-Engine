// node --env-file=.env.local scripts/test-intake.mjs
// Automated Verification Suite for Member 1 (Intake & Policy Engine)
import pg from "pg";

const pool = new pg.Pool({
  host: process.env.PG_HOST || "localhost",
  port: parseInt(process.env.PG_PORT || "5432", 10),
  database: process.env.PG_DATABASE || "claims_engine",
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD,
});

async function runTests() {
  console.log("================================================================================");
  console.log("  RUNNING AUTOMATED TEST SUITE: MEMBER 1 INTAKE & RELATIONAL ENGINE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      const start = performance.now();
      await fn();
      const elapsed = (performance.now() - start).toFixed(2);
      console.log(`  ✓ [PASS] ${name} (${elapsed}ms)`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // Test 1: Verify Core Relational Tables Exist
  await assertTest("Verification of 3NF Relational Tables in PostgreSQL", async () => {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'policies', 'claims', 'claim_status_history', 'claim_payouts');
    `);
    if (res.rows.length < 5) throw new Error(`Expected 5 tables, found ${res.rows.length}`);
  });

  // Test 2: Valid Claim Filing via sp_FileClaim
  let testClaimId = null;
  await assertTest("Execution of sp_FileClaim with Valid Inputs", async () => {
    const res = await pool.query(
      `CALL sp_FileClaim(1, CURRENT_DATE, 35000.00, NULL)`
    );
    testClaimId = res.rows[0]?.p_claim_id;
    if (!testClaimId) throw new Error("sp_FileClaim did not return a valid claim ID");
    
    // Check claim record
    const claimRes = await pool.query(`SELECT * FROM Claims WHERE claim_id = $1`, [testClaimId]);
    if (!claimRes.rows[0] || claimRes.rows[0].status !== "SUBMITTED") {
      throw new Error("Claim was not created in SUBMITTED status");
    }
  });

  // Test 3: Constraint Enforcement - Reject Over-Limit Claim
  await assertTest("sp_FileClaim Rejects Claim Exceeding Policy Coverage Limit", async () => {
    let caught = false;
    try {
      await pool.query(`CALL sp_FileClaim(1, CURRENT_DATE, 999999999.00, NULL)`);
    } catch (err) {
      caught = true;
      if (!err.message.includes("exceeds remaining coverage")) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }
    if (!caught) throw new Error("Stored procedure allowed an amount exceeding coverage!");
  });

  // Test 4: Constraint Enforcement - Reject Future Incident Date
  await assertTest("sp_FileClaim Rejects Future Incident Date", async () => {
    let caught = false;
    try {
      await pool.query(`CALL sp_FileClaim(1, '2099-01-01'::DATE, 10000.00, NULL)`);
    } catch (err) {
      caught = true;
      if (!err.message.includes("cannot be in the future")) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }
    if (!caught) throw new Error("Stored procedure allowed a future incident date!");
  });

  // Test 5: Trigger Verification - Automated Status Audit Logging
  await assertTest("Trigger trg_audit_claim_status Automatically Logs Transition", async () => {
    if (!testClaimId) throw new Error("No claim available to test trigger");
    
    await pool.query(
      `UPDATE Claims SET status = 'UNDER_REVIEW', assigned_adjuster_id = 3 WHERE claim_id = $1`,
      [testClaimId]
    );

    const histRes = await pool.query(
      `SELECT * FROM Claim_Status_History WHERE claim_id = $1 ORDER BY history_id DESC LIMIT 1`,
      [testClaimId]
    );

    if (histRes.rows.length === 0) throw new Error("Trigger did not log history entry");
    const entry = histRes.rows[0];
    if (entry.previous_status !== "SUBMITTED" || entry.new_status !== "UNDER_REVIEW") {
      throw new Error(`Invalid status transition recorded: ${entry.previous_status} -> ${entry.new_status}`);
    }
  });

  // Test 6: Adjuster View Interoperability
  await assertTest("Verification of vw_AdjusterPendingClaims with Window Aggregations", async () => {
    const res = await pool.query(`SELECT * FROM vw_AdjusterPendingClaims LIMIT 5`);
    if (res.rows.length === 0) throw new Error("Adjuster view returned 0 rows");
    const first = res.rows[0];
    if (!first.claim_number || first.total_claims_filed === undefined) {
      throw new Error("Adjuster view missing expected fields");
    }
  });

  console.log("\n================================================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  await pool.end();
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
