-- ============================================================================
-- ANALYTICAL DML QUERIES & EXECUTION PLANS (MEMBER 1: CORE RELATIONAL ENGINE)
-- ============================================================================

-- Query 1: Grouping claims by policy type with aggregation
-- Evaluates aggregate volume, total capital at risk, average claim size, and approved payouts per insurance line.
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    p.policy_type,
    COUNT(c.claim_id) AS total_claims_count,
    COALESCE(SUM(c.claimed_amount), 0.00) AS total_claimed_amount,
    COALESCE(ROUND(AVG(c.claimed_amount), 2), 0.00) AS avg_claimed_amount,
    COALESCE(SUM(c.approved_amount), 0.00) AS total_approved_payout
FROM Policies p
LEFT JOIN Claims c ON p.policy_id = c.policy_id
GROUP BY p.policy_type
ORDER BY total_claimed_amount DESC;

-- Query 2: Nested Subquery to identify policyholders with multiple open/pending claims
-- Crucial for fraud detection and risk underwriting scrutiny.
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    u.user_id,
    u.full_name AS policyholder_name,
    u.email,
    u.phone,
    open_claims.active_claim_count,
    open_claims.total_pending_exposure
FROM Users u
JOIN (
    SELECT 
        p.user_id, 
        COUNT(c.claim_id) AS active_claim_count,
        SUM(c.claimed_amount) AS total_pending_exposure
    FROM Policies p
    JOIN Claims c ON p.policy_id = c.policy_id
    WHERE c.status IN ('SUBMITTED', 'UNDER_REVIEW')
    GROUP BY p.user_id
    HAVING COUNT(c.claim_id) > 1
) open_claims ON u.user_id = open_claims.user_id;

-- Query 3: Correlated Subquery to identify claims exceeding the peer average for their policy type
-- Flags disproportionately large claims within each category.
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    c.claim_id,
    c.claim_number,
    p.policy_type,
    c.claimed_amount,
    c.incident_date,
    c.status
FROM Claims c
JOIN Policies p ON c.policy_id = p.policy_id
WHERE c.claimed_amount > (
    SELECT AVG(c2.claimed_amount)
    FROM Claims c2
    JOIN Policies p2 ON c2.policy_id = p2.policy_id
    WHERE p2.policy_type = p.policy_type
);

-- Query 4: Policyholder Coverage Utilization and Loss Ratio
-- Calculates remaining coverage vs total policy limit for active policies.
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    u.full_name AS policyholder,
    p.policy_number,
    p.policy_type,
    p.total_coverage,
    p.remaining_coverage,
    p.deductible,
    ROUND(((p.total_coverage - p.remaining_coverage) / p.total_coverage) * 100, 2) AS coverage_depleted_pct
FROM Policies p
JOIN Users u ON p.user_id = u.user_id
ORDER BY coverage_depleted_pct DESC;
